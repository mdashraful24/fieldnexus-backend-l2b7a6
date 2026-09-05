import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SuperAdminService } from "./superAdmin.service";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await SuperAdminService.getAllAdmins(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admins retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
	const adminId = req.params.id as string;

	const result = await SuperAdminService.getAdminById(adminId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin retrieved successfully",
		data: result,
	});
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await SuperAdminService.createAdmin(payload, user, req.ip);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Admin created successfully",
		data: result,
	});
});

const updateAdminStatus = catchAsync(async (req: Request, res: Response) => {
	const adminId = req.params.id as string;
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await SuperAdminService.updateAdminStatus(
		adminId,
		payload,
		user,
		req.ip,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin status updated successfully",
		data: result,
	});
});

const restoreAdmin = catchAsync(async (req: Request, res: Response) => {
	const adminId = req.params.id as string;
	const user = req.user as RequestUser;

	const result = await SuperAdminService.restoreAdmin(adminId, user, req.ip);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin restored successfully",
		data: result,
	});
});

const updateAdminProfile = catchAsync(async (req: Request, res: Response) => {
	const adminId = req.params.id as string;
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await SuperAdminService.updateAdminProfile(
		adminId,
		payload,
		user,
		req.ip,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin updated successfully",
		data: result,
	});
});

export const SuperAdminController = {
	getAllAdmins,
	getAdminById,
	createAdmin,
	updateAdminStatus,
	restoreAdmin,
	updateAdminProfile,
};
