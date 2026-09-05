import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianApplicationService } from "./technicianApplication.service";

const applyAsTechnician = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const files = req.files as
		| {
				resume?: Express.Multer.File[];
				additionalDocuments?: Express.Multer.File[];
		  }
		| undefined;

	const result = await TechnicianApplicationService.applyAsTechnician(
		payload,
		files?.resume,
		files?.additionalDocuments,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message:
			"Application submitted successfully. Our team will review it soon.",
		data: result,
	});
});

const getAllApplications = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await TechnicianApplicationService.getAllApplications(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician applications retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getApplicationById = catchAsync(async (req: Request, res: Response) => {
	const applicationId = req.params.id as string;

	const result =
		await TechnicianApplicationService.getApplicationById(applicationId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician application retrieved successfully",
		data: result,
	});
});

const getApplicationStatus = catchAsync(async (req: Request, res: Response) => {
	const email = req.query.email as string;

	const result = await TechnicianApplicationService.getApplicationStatus(email);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Application status retrieved successfully",
		data: result,
	});
});

const approveApplication = catchAsync(async (req: Request, res: Response) => {
	const applicationId = req.params.id as string;
	const reviewer = req.user as RequestUser;

	const result = await TechnicianApplicationService.approveApplication(
		applicationId,
		reviewer,
		req.ip,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message:
			"Application approved. Technician account created and credentials sent via email.",
		data: {
			application: result.updatedApplication,
			user: result.user,
		},
	});
});

const rejectApplication = catchAsync(async (req: Request, res: Response) => {
	const applicationId = req.params.id as string;
	const payload = req.body;
	const reviewer = req.user as RequestUser;

	const result = await TechnicianApplicationService.rejectApplication(
		applicationId,
		payload,
		reviewer,
		req.ip,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Application rejected and the applicant has been notified",
		data: result,
	});
});

export const TechnicianApplicationController = {
	applyAsTechnician,
	getAllApplications,
	getApplicationById,
	getApplicationStatus,
	approveApplication,
	rejectApplication,
};
