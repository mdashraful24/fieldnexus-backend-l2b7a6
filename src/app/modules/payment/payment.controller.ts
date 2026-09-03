import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentService } from "./payment.service";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await PaymentService.initiatePayment(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payment initiated successfully",
		data: result,
	});
});

const paymentCallback = catchAsync(async (req: Request, res: Response) => {
	const { redirectUrl } = await PaymentService.handlePaymentCallback(req.query);

	res.redirect(redirectUrl);
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
	const paymentId = req.params.paymentId as string;
	const user = req.user as RequestUser;

	const result = await PaymentService.getPaymentById(paymentId, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payment retrieved successfully",
		data: result,
	});
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const user = req.user as RequestUser;

	const result = await PaymentService.getAllPayments(query, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Payments retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const PaymentController = {
	initiatePayment,
	paymentCallback,
	getPaymentById,
	getAllPayments,
};
