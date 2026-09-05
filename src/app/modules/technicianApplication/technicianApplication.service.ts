import bcrypt from "bcryptjs";
import type { UploadApiResponse } from "cloudinary";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import path from "path";
import {
	NotificationType,
	Role,
	TechnicianApplicationStatus,
} from "../../../generated/prisma/enums";
import type { TechnicianApplicationWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import type { IQuery } from "../../interfaces";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	IApplyAsTechnicianPayload,
	IRejectApplicationPayload,
} from "./technicianApplication.interface";

const uploadFileToCloudinary = (buffer: Buffer) =>
	new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream({ resource_type: "auto" }, (error, result) => {
				if (error) {
					return reject(error);
				}

				if (!result) {
					return reject(
						new AppError(
							httpStatus.BAD_REQUEST,
							"No result returned from Cloudinary",
						),
					);
				}

				resolve(result);
			})
			.end(buffer);
	});

const applyAsTechnician = async (
	payload: IApplyAsTechnicianPayload,
	resume: Express.Multer.File[] | undefined,
	additionalDocuments: Express.Multer.File[] | undefined,
) => {
	const email = payload.email.trim().toLowerCase();

	const isUserExists = await prisma.user.findUnique({ where: { email } });

	if (isUserExists) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User with this email already exists",
		);
	}

	const existingApplication = await prisma.technicianApplication.findUnique({
		where: { email },
	});

	if (existingApplication) {
		if (existingApplication.status === TechnicianApplicationStatus.APPROVED) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A technician account has already been created for this email",
			);
		}

		if (existingApplication.status === TechnicianApplicationStatus.PENDING) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Your application is already under review",
			);
		}
	}

	let resumeUrl: string | null = existingApplication?.resume ?? null;
	let resumePublicId: string | null =
		existingApplication?.resumePublicId ?? null;

	if (resume?.[0]?.buffer) {
		const uploadedResume = await uploadFileToCloudinary(resume[0].buffer);
		resumeUrl = uploadedResume.secure_url;
		resumePublicId = uploadedResume.public_id;
	}

	if (!resumeUrl) {
		throw new AppError(httpStatus.BAD_REQUEST, "Resume is required");
	}

	let additionalDocumentsUploaded: { url: string; publicId: string }[] =
		(existingApplication?.additionalDocuments as
			| { url: string; publicId: string }[]
			| null) ?? [];

	if (additionalDocuments?.length) {
		const uploadedDocuments = await Promise.all(
			additionalDocuments.map((document) =>
				uploadFileToCloudinary(document.buffer),
			),
		);

		additionalDocumentsUploaded = uploadedDocuments.map((document) => ({
			url: document.secure_url,
			publicId: document.public_id,
		}));
	}

	const applicationData = {
		name: payload.name,
		email,
		phone: payload.phone,
		address: payload.address,
		qualifications: payload.qualifications,
		experienceYears: payload.experienceYears,
		bio: payload.bio,
		resume: resumeUrl,
		resumePublicId: resumePublicId,
		additionalDocuments: additionalDocumentsUploaded,
	};

	const application = existingApplication
		? await prisma.technicianApplication.update({
				where: { id: existingApplication.id },
				data: {
					...applicationData,
					status: TechnicianApplicationStatus.PENDING,
					rejectionReason: null,
					reviewedBy: null,
					reviewedAt: null,
					isDeleted: false,
					deletedAt: null,
				},
			})
		: await prisma.technicianApplication.create({
				data: applicationData,
			});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/technician-application-received.ejs",
	);

	const templateData = {
		name: application.name,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: application.email,
		subject: "Application Received - FieldNexus",
		html,
	});

	return application;
};

const getAllApplications = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: TechnicianApplicationWhereInput[] = [];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
				{
					qualifications: { contains: query.searchTerm, mode: "insensitive" },
				},
			],
		});
	}

	if (query.status) {
		andConditions.push({
			status: query.status as TechnicianApplicationStatus,
		});
	}

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	const where: TechnicianApplicationWhereInput = { AND: andConditions };

	const [applications, total] = await prisma.$transaction([
		prisma.technicianApplication.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			include: {
				technician: {
					select: { id: true, name: true, email: true },
				},
			},
		}),
		prisma.technicianApplication.count({ where }),
	]);

	return {
		data: applications,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getApplicationById = async (applicationId: string) => {
	const application = await prisma.technicianApplication.findUnique({
		where: { id: applicationId, isDeleted: false },
		include: {
			technician: {
				select: { id: true, name: true, email: true },
			},
		},
	});

	if (!application) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician application not found",
		);
	}

	return application;
};

const getApplicationStatus = async (email: string) => {
	if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new AppError(httpStatus.BAD_REQUEST, "A valid email is required");
	}

	const application = await prisma.technicianApplication.findUnique({
		where: { email: email.toLowerCase().trim() },
		select: {
			id: true,
			status: true,
			rejectionReason: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!application) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"No application found for this email",
		);
	}

	return application;
};

const approveApplication = async (
	applicationId: string,
	reviewer: RequestUser,
	ipAddress?: string,
) => {
	const application = await prisma.technicianApplication.findUnique({
		where: { id: applicationId },
	});

	if (!application || application.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician application not found",
		);
	}

	if (application.status !== TechnicianApplicationStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Application has already been reviewed",
		);
	}

	const existingUser = await prisma.user.findUnique({
		where: { email: application.email },
	});

	if (existingUser) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User with this email already exists",
		);
	}

	const tempPassword = crypto.randomBytes(6).toString("base64url");

	const hashedPassword = await bcrypt.hash(
		tempPassword,
		Number(config.bcrypt_salt_rounds),
	);

	const result = await prisma.$transaction(async (tx) => {
		const user = await tx.user.create({
			data: {
				name: application.name,
				email: application.email,
				password: hashedPassword,
				role: Role.TECHNICIAN,
				emailVerified: true,
				needPasswordChange: true,
				technician: {
					create: {
						name: application.name,
						email: application.email,
						address: application.address,
						contactNumber: application.phone,
						qualifications: application.qualifications,
						experienceYears: application.experienceYears,
						bio: application.bio,
						resume: application.resume,
						resumePublicId: application.resumePublicId,
						additionalDocuments: (application.additionalDocuments ??
							undefined) as unknown as
							| { url: string; publicId: string }[]
							| undefined,
					},
				},
			},
		});

		const technician = await tx.technician.findUnique({
			where: { userId: user.id },
		});

		const updatedApplication = await tx.technicianApplication.update({
			where: { id: application.id },
			data: {
				status: TechnicianApplicationStatus.APPROVED,
				reviewedBy: reviewer.userId,
				reviewedAt: new Date(),
				technicianId: technician?.id,
			},
		});

		await tx.notification.create({
			data: {
				userId: user.id,
				type: NotificationType.APPLICATION_APPROVED,
				message:
					"Your technician application has been approved. Welcome to FieldNexus!",
			},
		});

		await tx.auditLog.create({
			data: {
				action: "TECHNICIAN_APPLICATION_APPROVED",
				entityType: "TechnicianApplication",
				entityId: application.id,
				ipAddress: ipAddress ?? null,
				oldValue: { status: TechnicianApplicationStatus.PENDING },
				newValue: {
					status: TechnicianApplicationStatus.APPROVED,
					technicianId: technician?.id ?? null,
				},
				userId: reviewer.userId,
			},
		});

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
			technician,
			updatedApplication,
		};
	});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/technician-application-approved.ejs",
	);

	const templateData = {
		name: application.name,
		email: application.email,
		password: tempPassword,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: application.email,
		subject: "Your Technician Application Has Been Approved - FieldNexus",
		html,
	});

	return result;
};

const rejectApplication = async (
	applicationId: string,
	payload: IRejectApplicationPayload,
	reviewer: RequestUser,
	ipAddress?: string,
) => {
	const application = await prisma.technicianApplication.findUnique({
		where: { id: applicationId },
	});

	if (!application || application.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician application not found",
		);
	}

	if (application.status !== TechnicianApplicationStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Application has already been reviewed",
		);
	}

	const updatedApplication = await prisma.technicianApplication.update({
		where: { id: application.id },
		data: {
			status: TechnicianApplicationStatus.REJECTED,
			rejectionReason: payload.rejectionReason,
			reviewedBy: reviewer.userId,
			reviewedAt: new Date(),
		},
	});

	await prisma.auditLog.create({
		data: {
			action: "TECHNICIAN_APPLICATION_REJECTED",
			entityType: "TechnicianApplication",
			entityId: application.id,
			ipAddress: ipAddress ?? null,
			oldValue: { status: TechnicianApplicationStatus.PENDING },
			newValue: {
				status: TechnicianApplicationStatus.REJECTED,
				rejectionReason: payload.rejectionReason,
			},
			userId: reviewer.userId,
		},
	});

	const templatePath = path.join(
		process.cwd(),
		"src/app/templates/technician-application-rejected.ejs",
	);

	const templateData = {
		name: application.name,
		reason: updatedApplication.rejectionReason,
	};

	const html = await ejs.renderFile(templatePath, templateData);

	await transporter.sendMail({
		from: config.email_sender,
		to: application.email,
		subject: "Update on Your Technician Application - FieldNexus",
		html,
	});

	return updatedApplication;
};

export const TechnicianApplicationService = {
	applyAsTechnician,
	getAllApplications,
	getApplicationById,
	getApplicationStatus,
	approveApplication,
	rejectApplication,
};
