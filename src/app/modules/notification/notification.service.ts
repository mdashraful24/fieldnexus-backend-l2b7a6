import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";

const getMyNotifications = async (
	user: RequestUser,
	query: Record<string, unknown>,
) => {
	const page = Number(query.page ?? 1);
	const limit = Number(query.limit ?? 10);
	const skip = (page - 1) * limit;

	const where = { userId: user.userId };

	const [notifications, total] = await prisma.$transaction([
		prisma.notification.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.notification.count({ where }),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: notifications,
	};
};

const markAsRead = async (notificationId: string, user: RequestUser) => {
	const notification = await prisma.notification.findFirst({
		where: {
			id: notificationId,
			userId: user.userId,
		},
	});

	if (!notification) {
		throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
	}

	const updatedNotification = await prisma.notification.update({
		where: { id: notification.id },
		data: { isRead: true },
	});

	return updatedNotification;
};

const markAllAsRead = async (user: RequestUser) => {
	const result = await prisma.notification.updateMany({
		where: {
			userId: user.userId,
			isRead: false,
		},
		data: { isRead: true },
	});

	return { updatedCount: result.count };
};

export const NotificationService = {
	getMyNotifications,
	markAsRead,
	markAllAsRead,
};
