import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminService.getDashboardStats();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dashboard statistics retrieved successfully",
		data: result,
	});
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await AdminService.getAllUsers(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	const userId = req.params.id as string;
	const payload = req.body;

	const result = await AdminService.updateUserStatus(userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User status updated successfully",
		data: result,
	});
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await AdminService.getAuditLogs(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Audit logs retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getVendorPerformance = catchAsync(async (req: Request, res: Response) => {
	const vendorId = req.params.id as string;

	const result = await AdminService.getVendorPerformance(vendorId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor performance retrieved successfully",
		data: result,
	});
});

export const AdminController = {
	getDashboardStats,
	getAllUsers,
	updateUserStatus,
	getAuditLogs,
	getVendorPerformance,
};
