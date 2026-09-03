import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AssignmentService } from "./assignment.service";

const assignWorkOrder = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const payload = req.body;

	const result = await AssignmentService.assignWorkOrder(id, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Work order assigned successfully",
		data: result,
	});
});

const acceptWorkOrder = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const user = req.user as RequestUser;

	const result = await AssignmentService.acceptWorkOrder(id, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Work order accepted successfully",
		data: result,
	});
});

const rejectWorkOrder = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await AssignmentService.rejectWorkOrder(
		id,
		payload.rejectionReason,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Work order rejected successfully",
		data: result,
	});
});

export const AssignmentController = {
	assignWorkOrder,
	acceptWorkOrder,
	rejectWorkOrder,
};
