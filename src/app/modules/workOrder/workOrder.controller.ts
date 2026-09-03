import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { WorkOrderService } from "./workOrder.service";

const createWorkOrder = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await WorkOrderService.createWorkOrder(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Work order created successfully",
		data: result,
	});
});

const getAllWorkOrders = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await WorkOrderService.getAllWorkOrders(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Work orders retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getWorkOrderById = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const user = req.user as RequestUser;

	const result = await WorkOrderService.getWorkOrderById(id, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Work order retrieved successfully",
		data: result,
	});
});

const updateWorkOrder = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const payload = req.body;

	const result = await WorkOrderService.updateWorkOrder(id, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Work order updated successfully",
		data: result,
	});
});

const updateWorkOrderStatus = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const payload = req.body;
		const user = req.user as RequestUser;

		const result = await WorkOrderService.updateWorkOrderStatus(
			id,
			payload,
			user,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Work order status updated successfully",
			data: result,
		});
	},
);

const getMyAssignedWorkOrders = catchAsync(
	async (req: Request, res: Response) => {
		const user = req.user as RequestUser;

		const result = await WorkOrderService.getMyAssignedWorkOrders(user);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "My assigned work orders retrieved successfully",
			data: result,
		});
	},
);

const deleteWorkOrder = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;

	await WorkOrderService.deleteWorkOrder(id);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Work order deleted successfully",
		data: null,
	});
});

export const WorkOrderController = {
	createWorkOrder,
	getAllWorkOrders,
	getWorkOrderById,
	updateWorkOrder,
	updateWorkOrderStatus,
	getMyAssignedWorkOrders,
	deleteWorkOrder,
};
