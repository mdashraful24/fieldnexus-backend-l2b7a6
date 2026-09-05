import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ServiceCategoryService } from "./serviceCategory.service";

const createServiceCategory = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		const result = await ServiceCategoryService.createServiceCategory(payload);

		sendResponse(res, {
			statusCode: httpStatus.CREATED,
			success: true,
			message: "Service category created successfully",
			data: result,
		});
	},
);

const getAllServiceCategories = catchAsync(
	async (req: Request, res: Response) => {
		const query = req.query;

		const result = await ServiceCategoryService.getAllServiceCategories(query);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Service categories retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

const getServiceCategoryById = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;

		const result = await ServiceCategoryService.getServiceCategoryById(id);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Service category retrieved successfully",
			data: result,
		});
	},
);

const updateServiceCategory = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;

		const result = await ServiceCategoryService.updateServiceCategory(
			id,
			payload,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Service category updated successfully",
			data: result,
		});
	},
);

const deleteServiceCategory = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;

		await ServiceCategoryService.deleteServiceCategory(id);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Service category deleted successfully",
			data: null,
		});
	},
);

const restoreServiceCategory = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;

		const result = await ServiceCategoryService.restoreServiceCategory(id);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Service category restored successfully",
			data: result,
		});
	},
);

export const ServiceCategoryController = {
	createServiceCategory,
	getAllServiceCategories,
	getServiceCategoryById,
	updateServiceCategory,
	deleteServiceCategory,
	restoreServiceCategory,
};
