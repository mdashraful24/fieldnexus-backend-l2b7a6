import httpStatus from "http-status";
import {
	Role,
	UserStatus,
	WorkOrderStatus,
} from "../../../generated/prisma/enums";
import type { UserWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import type { IUpdateUserStatusPayload } from "./admin.interface";

const getDashboardStats = async () => {
	const [
		totalWorkOrders,
		completedWorkOrders,
		activeTechnicians,
		totalCustomers,
		workOrdersByStatus,
		recentWorkOrders,
	] = await Promise.all([
		prisma.workOrder.count({ where: { isDeleted: false } }),
		prisma.workOrder.count({
			where: { isDeleted: false, status: WorkOrderStatus.COMPLETED },
		}),
		prisma.technician.count({ where: { isDeleted: false } }),
		prisma.customer.count({ where: { isDeleted: false } }),
		prisma.workOrder.groupBy({
			by: ["status"],
			where: { isDeleted: false },
			_count: { _all: true },
		}),
		prisma.workOrder.findMany({
			where: { isDeleted: false },
			orderBy: { createdAt: "desc" },
			take: 10,
			select: {
				id: true,
				workOrderNumber: true,
				title: true,
				status: true,
				priority: true,
				createdAt: true,
			},
		}),
	]);

	const statusCounts = Object.fromEntries(
		Object.values(WorkOrderStatus).map((status) => [status, 0]),
	);

	for (const row of workOrdersByStatus) {
		statusCounts[row.status] = row._count._all;
	}

	const slaComplianceRate =
		totalWorkOrders === 0
			? 100
			: Number(
					((completedWorkOrders / Math.max(totalWorkOrders, 1)) * 100).toFixed(
						1,
					),
				);

	return {
		totalWorkOrders,
		completedWorkOrders,
		activeTechnicians,
		totalCustomers,
		totalRevenue: 0,
		slaComplianceRate,
		recentWorkOrders,
		workOrdersByStatus: statusCounts,
	};
};

const getAllUsers = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: UserWhereInput[] = [];

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.role) {
		andConditions.push({
			role: { equals: query.role as never },
		});
	}

	if (query.status) {
		andConditions.push({
			status: { equals: query.status as never },
		});
	}

	const where: UserWhereInput = { AND: andConditions };

	const users = await prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			imageUrl: true,
			createdAt: true,
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.user.count({ where });

	return {
		data: users,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const updateUserStatus = async (
	userId: string,
	payload: IUpdateUserStatusPayload,
	actor: RequestUser,
	ipAddress?: string,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a super admin can update the status of an admin",
		);
	}

	if (user.isDeleted && payload.status === UserStatus.DELETED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User is already deleted. Use the restore endpoint to reactivate the user.",
		);
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: {
			status: payload.status,
			...(payload.status === UserStatus.DELETED
				? { isDeleted: true, deletedAt: new Date() }
				: { isDeleted: false, deletedAt: null }),
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
		},
	});

	await prisma.auditLog.create({
		data: {
			action: "USER_STATUS_UPDATED",
			entityType: "User",
			entityId: user.id,
			ipAddress: ipAddress ?? null,
			oldValue: { status: user.status, isDeleted: user.isDeleted },
			newValue: {
				status: updatedUser.status,
				isDeleted: updatedUser.status === UserStatus.DELETED,
			},
			userId: actor.userId,
		},
	});

	return updatedUser;
};

const restoreUser = async (
	userId: string,
	actor: RequestUser,
	ipAddress?: string,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	if (!user.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User is not deleted, nothing to restore",
		);
	}

	if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a super admin can restore an admin user",
		);
	}

	const restoredUser = await prisma.user.update({
		where: { id: userId },
		data: {
			status: UserStatus.ACTIVE,
			isDeleted: false,
			deletedAt: null,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
		},
	});

	await prisma.auditLog.create({
		data: {
			action: "USER_RESTORED",
			entityType: "User",
			entityId: user.id,
			ipAddress: ipAddress ?? null,
			oldValue: { status: user.status, isDeleted: user.isDeleted },
			newValue: { status: restoredUser.status, isDeleted: false },
			userId: actor.userId,
		},
	});

	return restoredUser;
};

const getAuditLogs = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;

	const where: Record<string, unknown> = {};

	if (query.action) {
		where.action = { contains: query.action, mode: "insensitive" };
	}

	if (query.entityType) {
		where.entityType = { contains: query.entityType, mode: "insensitive" };
	}

	if (query.userId) {
		where.userId = query.userId;
	}

	const [auditLogs, total] = await prisma.$transaction([
		prisma.auditLog.findMany({
			where,
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
			},
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
		}),
		prisma.auditLog.count({ where }),
	]);

	return {
		data: auditLogs,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getVendorPerformance = async (vendorId: string) => {
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	const totalJobs = await prisma.workAssignment.count({
		where: { vendorId, isDeleted: false },
	});

	const completedJobs = await prisma.workAssignment.count({
		where: {
			vendorId,
			isDeleted: false,
			workOrder: { status: WorkOrderStatus.COMPLETED },
		},
	});

	const [completed, cancelled] = await Promise.all([
		prisma.workOrder.findMany({
			where: {
				status: WorkOrderStatus.COMPLETED,
				workAssignments: { some: { vendorId, isDeleted: false } },
			},
			select: {
				createdAt: true,
				completedAt: true,
			},
		}),
		prisma.workOrder.findMany({
			where: {
				status: WorkOrderStatus.CANCELLED,
				workAssignments: { some: { vendorId, isDeleted: false } },
			},
			select: { id: true },
		}),
	]);

	const completionTimes = completed
		.map((order) =>
			order.completedAt
				? (order.completedAt.getTime() - order.createdAt.getTime()) /
					(1000 * 60 * 60)
				: null,
		)
		.filter((time): time is number => time !== null);

	const averageCompletionTime =
		completionTimes.length === 0
			? 0
			: Number(
					(
						completionTimes.reduce((sum, t) => sum + t, 0) /
						completionTimes.length
					).toFixed(2),
				);

	const successRate =
		totalJobs === 0
			? 0
			: Number(((completedJobs / totalJobs) * 100).toFixed(1));

	return {
		vendorId: vendor.id,
		vendorName: vendor.name,
		totalJobs,
		completedJobs,
		cancelledJobs: cancelled.length,
		slaBreaches: 0,
		averageCompletionTime: `${averageCompletionTime} hours`,
		averageRating: vendor.rating,
		successRate,
	};
};

export const AdminService = {
	getDashboardStats,
	getAllUsers,
	updateUserStatus,
	restoreUser,
	getAuditLogs,
	getVendorPerformance,
};
