import httpStatus from "http-status";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateContactMessagePayload } from "./contact.interface";

const createContactMessage = async (payload: ICreateContactMessagePayload) => {
	const message = await prisma.contactMessage.create({ data: payload });

	return message;
};

const getAllContactMessages = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 20;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;

	const where = query.isRead ? { isRead: query.isRead === "true" } : {};

	const [messages, totalCount] = await Promise.all([
		prisma.contactMessage.findMany({
			where,
			take: limit,
			skip: skip,
			orderBy: { createdAt: "desc" },
		}),
		prisma.contactMessage.count({ where }),
	]);

	if (messages.length === 0 && totalCount === 0 && page > 1) {
		throw new AppError(httpStatus.NOT_FOUND, "No contact messages found");
	}

	return {
		data: messages,
		meta: {
			page: page,
			limit: limit,
			total: totalCount,
			totalPages: Math.ceil(totalCount / limit),
		},
	};
};

const updateContactMessageReadStatus = async (
	messageId: string,
	isRead: boolean,
) => {
	const existingMessage = await prisma.contactMessage.findUnique({
		where: { id: messageId },
	});

	if (!existingMessage) {
		throw new AppError(httpStatus.NOT_FOUND, "Contact message not found");
	}

	const updatedMessage = await prisma.contactMessage.update({
		where: { id: messageId },
		data: { isRead },
	});

	return updatedMessage;
};

export const ContactService = {
	createContactMessage,
	getAllContactMessages,
	updateContactMessageReadStatus,
};
