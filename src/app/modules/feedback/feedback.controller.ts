import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { FeedbackService } from "./feedback.service";

const createFeedback = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const payload = req.body;
	const user = req.user as RequestUser;

	const result = await FeedbackService.createFeedback(id, payload, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Feedback submitted successfully",
		data: result,
	});
});

const getFeedback = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id as string;
	const user = req.user as RequestUser;

	const result = await FeedbackService.getFeedback(id, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feedback retrieved successfully",
		data: result,
	});
});

export const FeedbackController = {
	createFeedback,
	getFeedback,
};
