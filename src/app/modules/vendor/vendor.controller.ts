import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { VendorService } from "./vendor.service";

const createVendor = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await VendorService.createVendor(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Vendor created successfully",
		data: result,
	});
});

const getAllVendors = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await VendorService.getAllVendors(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendors retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getVendorById = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const result = await VendorService.getVendorById(id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor retrieved successfully",
		data: result,
	});
});

const updateVendor = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const payload = req.body;

	const result = await VendorService.updateVendor(id, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor updated successfully",
		data: result,
	});
});

const deleteVendor = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	await VendorService.deleteVendor(id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor deleted successfully",
		data: null,
	});
});

const restoreVendor = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	const result = await VendorService.restoreVendor(id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor restored successfully",
		data: result,
	});
});

const addMember = catchAsync(async (req: Request, res: Response) => {
	const vendorId = req.params.vendorId as string;
	const payload = req.body;

	const result = await VendorService.addMember(vendorId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Technician added to vendor successfully",
		data: result,
	});
});

const getMembers = catchAsync(async (req: Request, res: Response) => {
	const vendorId = req.params.vendorId as string;

	const result = await VendorService.getMembers(vendorId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendor members retrieved successfully",
		data: result,
	});
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
	const vendorId = req.params.vendorId as string;
	const technicianId = req.params.technicianId as string;

	await VendorService.removeMember(vendorId, technicianId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician removed from vendor successfully",
		data: null,
	});
});

const restoreMember = catchAsync(async (req: Request, res: Response) => {
	const vendorId = req.params.vendorId as string;
	const technicianId = req.params.technicianId as string;

	const result = await VendorService.restoreMember(vendorId, technicianId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Technician restored to vendor successfully",
		data: result,
	});
});

export const VendorController = {
	createVendor,
	getAllVendors,
	getVendorById,
	updateVendor,
	deleteVendor,
	restoreVendor,
	addMember,
	getMembers,
	removeMember,
	restoreMember,
};
