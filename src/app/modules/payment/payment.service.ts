import { format } from "date-fns";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import PDFDocument from "pdfkit";
import "pdfkit/standard-fonts/Helvetica";
import "pdfkit/standard-fonts/HelveticaBold";
import { Prisma } from "../../../generated/prisma/client";
import {
	NotificationType,
	PaymentStatus,
	Role,
	WorkOrderStatus,
} from "../../../generated/prisma/enums";
import type { PaymentWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import type { IQuery } from "../../interfaces";
import { getBkashIdToken } from "../../lib/bkash";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	IInitiatePaymentPayload,
	IRefundPaymentPayload,
} from "./payment.interface";

const sendPaymentInvoiceEmail = async (
	paymentId: string,
	trxId: string,
	tx: Prisma.TransactionClient,
) => {
	const payment = await tx.payment.findUnique({
		where: { id: paymentId },
		include: {
			customer: true,
			workOrder: {
				include: {
					category: true,
					workAssignments: {
						where: { isDeleted: false },
						orderBy: { createdAt: "desc" },
						take: 1,
						include: {
							vendor: true,
							technician: true,
						},
					},
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const workOrder = payment.workOrder;
	const customer = payment.customer;
	const latestAssignment = workOrder.workAssignments[0];
	const technician = latestAssignment?.technician;
	const vendor = latestAssignment?.vendor;

	const normalizeBkashDate = (dateStr: string) =>
		dateStr
			.replace(/(\d{2}:\d{2}:\d{2}):(\d{3})/, "$1.$2")
			.replace(/\s*GMT/, "");

	const rawPaidAt = payment.paidAt;
	const paidAt =
		rawPaidAt && !Number.isNaN(new Date(rawPaidAt).getTime())
			? new Date(rawPaidAt)
			: rawPaidAt && !Number.isNaN(new Date(normalizeBkashDate(rawPaidAt)).getTime())
				? new Date(normalizeBkashDate(rawPaidAt))
				: new Date();
	const formattedDate = format(paidAt, "dd MMMM yyyy");
	const formattedTime = format(paidAt, "HH:mm");

	// ========================================
	// Generate Invoice PDF
	// ========================================
	const pdfDocument = new PDFDocument({ margin: 50, size: "A4" });

	const pdfChunks: Buffer[] = [];

	pdfDocument.on("data", (chunk: Buffer) => {
		pdfChunks.push(chunk);
	});

	const pdfReadyPromise = new Promise<Buffer>((resolve) => {
		pdfDocument.on("end", () => {
			resolve(Buffer.concat(pdfChunks));
		});
	});

	const primaryColor = "#0f766e";
	const darkColor = "#0f172a";
	const textColor = "#475569";
	const lightColor = "#f0fdfa";
	const borderColor = "#e2e8f0";
	const successColor = "#16a34a";

	// Header
	pdfDocument
		.fontSize(22)
		.font("Helvetica-Bold")
		.fillColor(primaryColor)
		.text("FIELDNEXUS", { align: "center" });

	pdfDocument
		.fontSize(10)
		.font("Helvetica")
		.fillColor(textColor)
		.text("Field Service Operations Platform", { align: "center" });

	pdfDocument.moveDown(1.5);

	pdfDocument
		.fontSize(20)
		.font("Helvetica-Bold")
		.fillColor(darkColor)
		.text("PAYMENT INVOICE", { align: "center" });

	pdfDocument.moveDown(0.8);

	pdfDocument
		.fontSize(10)
		.font("Helvetica")
		.fillColor(textColor)
		.text(`Invoice No: #${payment.merchantInvoiceNumber ?? payment.id}`);

	pdfDocument.text(`Invoice Date: ${formattedDate}`, { align: "right" });

	pdfDocument.moveDown(1);

	// Horizontal line
	pdfDocument
		.moveTo(50, pdfDocument.y)
		.lineTo(545, pdfDocument.y)
		.lineWidth(1)
		.strokeColor(borderColor)
		.stroke();

	pdfDocument.moveDown(1.5);

	// Customer Information
	pdfDocument
		.fontSize(13)
		.font("Helvetica-Bold")
		.fillColor(darkColor)
		.text("BILLED TO");

	pdfDocument.moveDown(0.5);

	pdfDocument
		.fontSize(10)
		.font("Helvetica")
		.fillColor(textColor)
		.text(`Customer Name: ${customer.name}`)
		.text(`Customer Email: ${customer.email}`)
		.text(`Contact Number: ${customer.contactNumber ?? "N/A"}`);

	pdfDocument.moveDown(1.5);

	// Provider Information
	if (vendor?.name || technician?.name) {
		pdfDocument
			.fontSize(13)
			.font("Helvetica-Bold")
			.fillColor(darkColor)
			.text("SERVICE PROVIDER");

		pdfDocument.moveDown(0.5);

		if (vendor?.name) {
			pdfDocument
				.fontSize(10)
				.font("Helvetica")
				.fillColor(textColor)
				.text(`Vendor: ${vendor.name}`);
		}

		if (technician) {
			pdfDocument
				.fontSize(10)
				.font("Helvetica")
				.fillColor(textColor)
				.text(
					`Technician: ${technician.name} (${technician.contactNumber ?? "N/A"})`,
				);
		}

		pdfDocument.moveDown(1.5);
	}

	// Work Order Details
	pdfDocument
		.fontSize(13)
		.font("Helvetica-Bold")
		.fillColor(darkColor)
		.text("WORK ORDER DETAILS");

	pdfDocument.moveDown(0.5);

	pdfDocument
		.fontSize(10)
		.font("Helvetica")
		.fillColor(textColor)
		.text(`Work Order No: ${workOrder.workOrderNumber}`)
		.text(`Title: ${workOrder.title}`)
		.text(`Category: ${workOrder.category.name}`)
		.text(`Priority: ${workOrder.priority}`);

	if (workOrder.description) {
		pdfDocument.text(`Description: ${workOrder.description}`);
	}

	pdfDocument.moveDown(1.5);

	// Payment Table
	pdfDocument
		.fontSize(13)
		.font("Helvetica-Bold")
		.fillColor(darkColor)
		.text("PAYMENT DETAILS");

	pdfDocument.moveDown(0.7);

	const tableX = 50;
	const tableWidth = 495;
	const descriptionX = 65;
	const amountX = 430;

	const tableTop = pdfDocument.y;

	pdfDocument.rect(tableX, tableTop, tableWidth, 28).fill(primaryColor);

	pdfDocument
		.fontSize(10)
		.font("Helvetica-Bold")
		.fillColor("#ffffff")
		.text("DESCRIPTION", descriptionX, tableTop + 9);

	pdfDocument.text("AMOUNT", amountX, tableTop + 9, {
		width: 90,
		align: "right",
	});

	const rowTop = tableTop + 28;

	pdfDocument.rect(tableX, rowTop, tableWidth, 35).fill(lightColor);

	pdfDocument
		.fontSize(10)
		.font("Helvetica")
		.fillColor(textColor)
		.text(`${workOrder.category.name} Service`, descriptionX, rowTop + 11);

	pdfDocument.text(`${payment.amount} BDT`, amountX, rowTop + 11, {
		width: 90,
		align: "right",
	});

	const totalTop = rowTop + 50;

	pdfDocument
		.fontSize(12)
		.font("Helvetica-Bold")
		.fillColor(darkColor)
		.text("TOTAL PAID", 350, totalTop);

	pdfDocument
		.fontSize(12)
		.font("Helvetica-Bold")
		.fillColor(successColor)
		.text(`${payment.amount} BDT`, amountX, totalTop, {
			width: 90,
			align: "right",
		});

	pdfDocument.moveDown(2);

	// Payment Information
	pdfDocument
		.fontSize(10)
		.font("Helvetica")
		.fillColor(textColor)
		.text("Payment Method: bKash")
		.text(`Transaction ID: ${trxId}`)
		.text(`Paid At: ${formattedDate} ${formattedTime}`);

	pdfDocument.moveDown(1);

	// Payment Status
	const statusY = pdfDocument.y;

	pdfDocument.roundedRect(180, statusY, 235, 35, 6).fill("#dcfce7");

	pdfDocument
		.fontSize(12)
		.font("Helvetica-Bold")
		.fillColor(successColor)
		.text("PAYMENT SUCCESSFUL", 180, statusY + 11, {
			width: 235,
			align: "center",
		});

	pdfDocument.moveDown(3);

	// Thank You Message
	pdfDocument
		.fontSize(11)
		.font("Helvetica-Bold")
		.fillColor(darkColor)
		.text("Thank you for choosing FieldNexus!", {
			align: "center",
		});

	pdfDocument.moveDown(0.5);

	pdfDocument
		.fontSize(9)
		.font("Helvetica")
		.fillColor(textColor)
		.text(
			"This is a computer-generated invoice and does not require a signature.",
			{
				align: "center",
			},
		);

	// Footer
	pdfDocument
		.fontSize(8)
		.font("Helvetica")
		.fillColor("#94a3b8")
		.text(
			`© ${new Date().getFullYear()} FieldNexus. All rights reserved.`,
			50,
			760,
			{
				align: "center",
			},
		);

	pdfDocument.end();

	const pdfBuffer = await pdfReadyPromise;

	// ========================================
	// Send Email with PDF Attachment
	// ========================================
	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/payment-confirmation.ejs",
	);

	const templateData = {
		name: customer.name,
		workOrderNumber: workOrder.workOrderNumber,
		title: workOrder.title,
		amount: payment.amount.toString(),
		bkashTrxId: trxId,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: customer.email,
		subject: `Payment Receipt - ${workOrder.workOrderNumber} - FieldNexus`,
		html,
		attachments: [
			{
				filename: `payment-invoice-${workOrder.workOrderNumber}.pdf`,
				content: pdfBuffer,
				contentType: "application/pdf",
			},
		],
	});
};

const sendRefundConfirmationEmail = async (paymentId: string) => {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId },
		include: {
			customer: true,
			workOrder: true,
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const customer = payment.customer;
	const workOrder = payment.workOrder;
	const refundAt = new Date(payment.refundAt ?? new Date());
	const formattedDate = format(refundAt, "dd MMMM yyyy");

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/refund-confirmation.ejs",
	);

	const templateData = {
		name: customer.name,
		workOrderNumber: workOrder.workOrderNumber,
		title: workOrder.title,
		refundAmount: payment.refundAmount?.toString() ?? payment.amount.toString(),
		refundReason: payment.refundReason,
		refundTrxId: payment.refundTrxId,
		refundAt: formattedDate,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: customer.email,
		subject: `Refund Confirmation - ${workOrder.workOrderNumber} - FieldNexus`,
		html,
	});
};

const initiatePayment = async (
	payload: IInitiatePaymentPayload,
	user: RequestUser,
) => {
	const transactionResult = await prisma.$transaction(async(tx)=>{
		const customer = await tx.customer.findUnique({
			where: { userId: user.userId, isDeleted: false },
			include: { user: { select: { email: true } } },
		});

		if (!customer) {
			throw new AppError(httpStatus.NOT_FOUND, "Customer profile not found");
		}

		const workOrder = await tx.workOrder.findUnique({
			where: { id: payload.workOrderId, isDeleted: false },
			include: {
				category: true,
				payment: true,
			},
		});

		if (!workOrder) {
			throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
		}

		if (customer.id !== workOrder.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only pay for your own work orders",
			);
		}

		if (workOrder.status !== WorkOrderStatus.COMPLETED) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Payment can only be initiated for COMPLETED work orders",
			);
		}

		if (workOrder.payment?.status === PaymentStatus.PAID) {
			throw new AppError(
				httpStatus.CONFLICT,
				"This work order has already been paid",
			);
		}

		const amount = workOrder.category.basePrice;

		if (!amount) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"No base price is set for this service category",
			);
		}

		const payerReference = payload.payerReference ?? customer.user.email;

		const bkashIdToken = await getBkashIdToken();

		if (!bkashIdToken) {
			throw new AppError(httpStatus.BAD_REQUEST, "No bKash access token found");
		}

		const createPaymentResponse = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/create`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: bkashIdToken,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({
					mode: "0011",
					payerReference,
					callbackURL: `${config.bkash_callback_url}/payments/callback`,
					amount: amount.toString(),
					currency: "BDT",
					intent: "sale",
					merchantInvoiceNumber: workOrder.workOrderNumber,
				}),
			},
		);

		const createPaymentResult = await createPaymentResponse.json();

		if (!createPaymentResponse.ok) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				createPaymentResult.statusMessage ?? "Failed to create bKash payment",
			);
		}

		await tx.payment.upsert({
			where: { workOrderId: workOrder.id },
			update: {
				merchantInvoiceNumber: createPaymentResult.merchantInvoiceNumber,
				bkashPaymentId: createPaymentResult.paymentID,
				payUrl: createPaymentResult.bkashURL,
				payerReference,
				gatewayResponse: createPaymentResult,
				status: PaymentStatus.UNPAID,
			},
			create: {
				workOrderId: workOrder.id,
				customerId: customer.id,
				amount,
				merchantInvoiceNumber: createPaymentResult.merchantInvoiceNumber,
				bkashPaymentId: createPaymentResult.paymentID,
				payUrl: createPaymentResult.bkashURL,
				payerReference,
				gatewayResponse: createPaymentResult,
				status: PaymentStatus.UNPAID,
			},
		});

		// console.log({ payment });

		return {
			paymentUrl: createPaymentResult.bkashURL,
		};
	});

	return transactionResult;
};

const handlePaymentCallback = async (query: Record<string, unknown>) => {
	const transactionResult = await prisma.$transaction(async(tx)=>{
		const paymentId = query.paymentID as string | undefined;
		const status = query.status as string | undefined;

		if (!paymentId) {
			throw new AppError(httpStatus.BAD_REQUEST, "Payment id missing");
		}

		if (!status) {
			throw new AppError(httpStatus.BAD_REQUEST, "Payment status is missing");
		}

		const bkashIdToken = await getBkashIdToken();

		if (!bkashIdToken) {
			throw new AppError(httpStatus.BAD_REQUEST, "No bKash access token found");
		}

		const executePaymentResponse = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/execute`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: bkashIdToken,
					"X-App-Key": config.bkash_app_key,
				},
				body: JSON.stringify({ paymentID: paymentId }),
			},
		);

		const executedPaymentResult = await executePaymentResponse.json();

		const payment = await tx.payment.findFirst({
			where: { bkashPaymentId: paymentId },
			include: { customer: { select: { userId: true } } },
		});

		if (!payment) {
			throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
		}

		if (status === "success") {
			await tx.payment.update({
				where: { id: payment.id },
				data: {
					status: PaymentStatus.PAID,
					bkashTrxId: executedPaymentResult.trxID,
					paidAt: executedPaymentResult.paymentExecuteTime,
				},
			});

			await tx.notification.create({
				data: {
					userId: payment.customer.userId,
					type: NotificationType.PAYMENT_SUCCESS,
					message: `Payment of ${payment.amount} BDT for your work order was successful.`,
				},
			});

			await sendPaymentInvoiceEmail(payment.id, executedPaymentResult.trxID, tx);

			return {
				redirectUrl: `${config.frontend_url}?payment=success`,
			};
		} else if (status === "failure") {
			await tx.payment.update({
				where: { id: payment.id },
				data: {
					status: PaymentStatus.FAILED,
					gatewayResponse: executedPaymentResult,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}?payment=failure`,
			};
		} else if (status === "cancel") {
			await tx.payment.update({
				where: { id: payment.id },
				data: {
					status: PaymentStatus.CANCELLED,
					gatewayResponse: executedPaymentResult,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}?payment=cancel`,
			};
		} else {
			return {
				redirectUrl: `${config.frontend_url}?payment=error`,
			};
		}
	}, {
		maxWait: 10000,
		timeout: 30000,
	});

	return transactionResult;
};

const getPaymentById = async (paymentId: string, user: RequestUser) => {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId, isDeleted: false },
		include: {
			workOrder: {
				select: {
					id: true,
					workOrderNumber: true,
					title: true,
					status: true,
				},
			},
			customer: {
				select: { id: true, name: true, email: true },
			},
		},
		omit:{
			payUrl: true,
			gatewayResponse: true,
		}
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
		return payment;
	}

	if (user.role === Role.CUSTOMER) {
		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (!customer || customer.id !== payment.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view your own payments",
			);
		}

		return payment;
	}

	if (user.role === Role.TECHNICIAN) {
		const technician = await prisma.technician.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		const assignment = await prisma.workAssignment.findFirst({
			where: {
				workOrderId: payment.workOrderId,
				technicianId: technician?.id,
				isDeleted: false,
			},
			select: { id: true },
		});

		if (!technician || !assignment) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view payments of work orders assigned to you",
			);
		}

		return payment;
	}

	throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
};

const getAllPayments = async (query: IQuery, user: RequestUser) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: PaymentWhereInput[] = [{ isDeleted: false }];

	if (query.status) {
		andConditions.push({
			status: { equals: query.status as never },
		});
	}

	if (user.role === Role.CUSTOMER) {
		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (customer) {
			andConditions.push({ customerId: customer.id });
		}
	}

	if (user.role === Role.TECHNICIAN) {
		const technician = await prisma.technician.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (technician) {
			andConditions.push({
				workOrder: {
					workAssignments: {
						some: {
							technicianId: technician.id,
							isDeleted: false,
						},
					},
				},
			});
		}
	}

	const where: PaymentWhereInput = { AND: andConditions };

	const payments = await prisma.payment.findMany({
		where,
		take: limit,
		skip: skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
		include: {
			workOrder: {
				select: {
					id: true,
					workOrderNumber: true,
					title: true,
					status: true,
				},
			},
			customer: {
				select: { id: true, name: true, email: true },
			},
		},
		omit:{
			payUrl: true,
			gatewayResponse: true,
		}
	});

	const totalPayments = await prisma.payment.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: payments,
		meta: {
			page,
			limit,
			total: totalPayments,
			totalPages: Math.ceil(totalPayments / limit),
		},
	};
};

const cancelPayment = async (paymentId: string, user: RequestUser) => {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId, isDeleted: false },
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
		if (user.role !== Role.CUSTOMER) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You are not authorized to cancel this payment",
			);
		}

		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (!customer || customer.id !== payment.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only cancel your own payments",
			);
		}
	}

	if (payment.status === PaymentStatus.PAID) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"A paid payment cannot be cancelled. Please request a refund instead.",
		);
	}

	if (payment.status === PaymentStatus.REFUNDED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A refunded payment cannot be cancelled",
		);
	}

	if (payment.status === PaymentStatus.CANCELLED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Payment has already been cancelled",
		);
	}

	const updatedPayment = await prisma.payment.update({
		where: { id: payment.id },
		data: {
			status: PaymentStatus.CANCELLED,
		},
		select: {
			id: true,
			amount: true,
			currency: true,
			gateway: true,
			status: true,
			merchantInvoiceNumber: true,
			bkashPaymentId: true,
			bkashTrxId: true,
			payerReference: true,
			workOrder: true,
			customer: true,
		},
	});

	return updatedPayment;
};

const refundPayment = async (
	paymentId: string,
	payload: IRefundPaymentPayload,
	user: RequestUser,
) => {
	const payment = await prisma.payment.findUnique({
		where: { id: paymentId, isDeleted: false },
		include: {
			workOrder: {
				select: {
					id: true,
					workOrderNumber: true,
					title: true,
					status: true,
				},
			},
			customer: {
				select: { id: true, name: true, email: true },
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
		if (user.role !== Role.CUSTOMER) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You are not authorized to refund this payment",
			);
		}

		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (!customer || customer.id !== payment.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only refund your own payments",
			);
		}
	}

	if (payment.status === PaymentStatus.REFUNDED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Payment has already been refunded",
		);
	}

	if (payment.status === PaymentStatus.CANCELLED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"A cancelled payment cannot be refunded",
		);
	}

	if (payment.status !== PaymentStatus.PAID) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only successful payments can be refunded",
		);
	}

	if (!payment.bkashPaymentId || !payment.bkashTrxId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"bKash payment and transaction id are missing",
		);
	}

	const refundReason =
		payload.reason ??
		`Refund for work order ${payment.workOrder.workOrderNumber}`;

	const bkashIdToken = await getBkashIdToken();

	if (!bkashIdToken) {
		throw new AppError(httpStatus.BAD_REQUEST, "No bKash access token found");
	}

	const bkashRefundPaymentResponse = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/payment/refund`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: bkashIdToken,
				"X-App-Key": config.bkash_app_key,
			},
			body: JSON.stringify({
				paymentID: payment.bkashPaymentId,
				trxID: payment.bkashTrxId,
				amount: payment.amount.toString(),
				sku: "Payment Refund",
				reason: refundReason,
			}),
		},
	);

	const bkashRefundPaymentResult = await bkashRefundPaymentResponse.json();

	if (!bkashRefundPaymentResponse.ok) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			bkashRefundPaymentResult.statusMessage ??
			"Failed to refund bKash payment",
		);
	}

	const completedTime = bkashRefundPaymentResult.completedTime as
		| string
		| undefined;

	const refundAt =
		completedTime && !Number.isNaN(new Date(completedTime).getTime())
			? new Date(completedTime)
			: new Date();

	const updatedPayment = await prisma.payment.update({
		where: { id: payment.id },
		data: {
			status: PaymentStatus.REFUNDED,
			refundTrxId: bkashRefundPaymentResult.refundTrxID,
			refundAmount: bkashRefundPaymentResult.amount ?? payment.amount,
			refundReason,
			refundAt,
			gatewayResponse: bkashRefundPaymentResult,
		},
	});

	await sendRefundConfirmationEmail(payment.id);

	return updatedPayment;
};

export const PaymentService = {
	initiatePayment,
	handlePaymentCallback,
	getPaymentById,
	getAllPayments,
	cancelPayment,
	refundPayment,
};
