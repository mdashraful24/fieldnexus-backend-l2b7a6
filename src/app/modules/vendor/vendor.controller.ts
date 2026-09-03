import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IVendorQueryParams } from "./vendor.interface";
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
	const query = req.query as unknown as IVendorQueryParams;

	const result = await VendorService.getAllVendors(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Vendors retrieved successfully",
		data: result.result,
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

export const VendorController = {
	createVendor,
	getAllVendors,
	getVendorById,
	updateVendor,
	deleteVendor,
};
