import type { Prisma } from "../../generated/prisma/client";
import { type NotificationType, Role } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";

type Db = Prisma.TransactionClient;

const ADMIN_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];

export const getUserIdsByRoles = async (roles: Role[]): Promise<string[]> => {
	const users = await prisma.user.findMany({
		where: { role: { in: roles }, isDeleted: false },
		select: { id: true },
	});

	return users.map((user) => user.id);
};

export const getAdminUserIds = () => getUserIdsByRoles(ADMIN_ROLES);

export const notifyUsers = async (
	db: Db,
	userIds: string[],
	type: NotificationType,
	message: string,
): Promise<void> => {
	const uniqueIds = [...new Set(userIds)].filter(Boolean);

	if (uniqueIds.length === 0) {
		return;
	}

	await db.notification.createMany({
		data: uniqueIds.map((userId) => ({ userId, type, message })),
	});
};

export const notifyRoles = async (
	db: Db,
	roles: Role[],
	type: NotificationType,
	message: string,
): Promise<void> => {
	await notifyUsers(db, await getUserIdsByRoles(roles), type, message);
};
