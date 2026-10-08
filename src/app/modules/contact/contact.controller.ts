import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ContactService } from "./contact.service";

const createContactMessage = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await ContactService.createContactMessage(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Message sent successfully",
		data: result,
	});
});

const getAllContactMessages = catchAsync(
	async (req: Request, res: Response) => {
		const query = req.query;

		const result = await ContactService.getAllContactMessages(query);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Contact messages retrieved successfully",
			data: result.data,
			meta: result.meta,
		});
	},
);

const updateContactMessageReadStatus = catchAsync(
	async (req: Request, res: Response) => {
		const id = req.params.id as string;
		const { isRead } = req.body;

		const result = await ContactService.updateContactMessageReadStatus(
			id,
			isRead,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Contact message updated successfully",
			data: result,
		});
	},
);

export const ContactController = {
	createContactMessage,
	getAllContactMessages,
	updateContactMessageReadStatus,
};
