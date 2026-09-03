import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../../middlewares/checkAuth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as RequestUser;
	const query = req.query;

	const result = await NotificationService.getMyNotifications(user, query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notifications retrieved successfully",
		meta: result.meta,
		data: result.data,
	});
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
	const notificationId = req.params.id as string;
	const user = req.user as RequestUser;

	const result = await NotificationService.markAsRead(notificationId, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notification marked as read",
		data: result,
	});
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as RequestUser;

	const result = await NotificationService.markAllAsRead(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "All notifications marked as read",
		data: result,
	});
});

export const NotificationController = {
	getMyNotifications,
	markAsRead,
	markAllAsRead,
};
