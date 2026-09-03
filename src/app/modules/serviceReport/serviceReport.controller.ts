import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ServiceReportService } from "./serviceReport.service";

const createServiceReport = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await ServiceReportService.createServiceReport(
		id,
		payload,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Service report submitted successfully",
		data: result,
	});
});

const getServiceReport = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const user = req.user as RequestUser;

	const result = await ServiceReportService.getServiceReport(id, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service report retrieved successfully",
		data: result,
	});
});

export const ServiceReportController = {
	createServiceReport,
	getServiceReport,
};
