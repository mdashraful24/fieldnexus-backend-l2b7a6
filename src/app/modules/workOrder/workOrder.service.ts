import httpStatus from "http-status";
import type { WorkOrderWhereInput } from "../../../generated/prisma/models";
import {
	AssignmentStatus,
	WorkOrderPriority,
	WorkOrderStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IQuery } from "../../interfaces";
import type { RequestUser } from "../../middlewares/checkAuth";
import type {
	ICreateWorkOrderPayload,
	IUpdateWorkOrderPayload,
	IUpdateWorkOrderStatusPayload,
} from "./workOrder.interface";
import { VALID_TRANSITIONS } from "./workOrder.interface";

const calculateSlaDeadline = (priority: WorkOrderPriority): Date => {
	const hoursByPriority: Record<WorkOrderPriority, number> = {
		[WorkOrderPriority.LOW]: 72,
		[WorkOrderPriority.MEDIUM]: 48,
		[WorkOrderPriority.HIGH]: 24,
		[WorkOrderPriority.URGENT]: 12,
	};

	return new Date(Date.now() + hoursByPriority[priority] * 60 * 60 * 1000);
};

const generateWorkOrderNumber = async (): Promise<string> => {
	const date = new Date();
	const prefix = `WO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

	return await prisma.$transaction(async (tx) => {
		const lastOrder = await tx.workOrder.findFirst({
			where: {
				workOrderNumber: { startsWith: prefix },
			},
			orderBy: { workOrderNumber: "desc" },
			select: { workOrderNumber: true },
		});

		let counter = 1;
		if (lastOrder) {
			const lastNumber = lastOrder.workOrderNumber.split("-").pop();
			counter = Number(lastNumber) + 1;
		}

		return `${prefix}-${String(counter).padStart(4, "0")}`;
	});
};

const createWorkOrder = async (
	payload: ICreateWorkOrderPayload,
	user: RequestUser,
) => {
	const customer = await prisma.customer.findUnique({
		where: { userId: user.userId },
	});

	if (!customer) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Customer profile not found. Please complete your profile.",
		);
	}

	const category = await prisma.serviceCategory.findUnique({
		where: { id: payload.categoryId, isDeleted: false, isActive: true },
	});

	if (!category) {
		throw new AppError(httpStatus.NOT_FOUND, "Service category not found");
	}

	const workOrderNumber = await generateWorkOrderNumber();
	const priority = payload.priority ?? WorkOrderPriority.MEDIUM;

	const workOrder = await prisma.workOrder.create({
		data: {
			workOrderNumber,
			title: payload.title,
			description: payload.description,
			categoryId: payload.categoryId,
			customerId: customer.id,
			priority,
			slaDeadline: calculateSlaDeadline(priority),
			scheduledAt: payload.scheduledAt
				? new Date(payload.scheduledAt)
				: undefined,
			latitude: payload.latitude,
			longitude: payload.longitude,
		},
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					contactNumber: true,
					address: true,
				},
			},
			category: {
				select: {
					id: true,
					name: true,
					description: true,
				},
			},
		},
	});

	return workOrder;
};

const getAllWorkOrders = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: WorkOrderWhereInput[] = [];

	// Add search term condition if provided
	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					workOrderNumber: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					title: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					description: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	// Add any other filter conditions based on the query parameters
	if (query.status) {
		andConditions.push({ status: query.status as WorkOrderStatus });
	}

	if (query.priority) {
		andConditions.push({ priority: query.priority as WorkOrderPriority });
	}

	if (query.customerId) {
		andConditions.push({ customerId: query.customerId });
	}

	if (query.categoryId) {
		andConditions.push({ categoryId: query.categoryId });
	}

	andConditions.push({ isDeleted: false });

	const whereCondition: WorkOrderWhereInput = {
		AND: andConditions,
	};

	const validSortFields = [
		"workOrderNumber",
		"title",
		"status",
		"priority",
		"createdAt",
		"updatedAt",
		"slaDeadline",
	];
	const actualSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
	const actualSortOrder = sortOrder === "asc" ? "asc" : "desc";

	const allWorkOrders = await prisma.workOrder.findMany({
		where: whereCondition,

		// dynamic pagination and sorting
		take: limit,
		skip: skip,

		orderBy: {
			[actualSortBy]: actualSortOrder,
		},

		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					contactNumber: true,
					address: true,
				},
			},
			category: {
				select: {
					id: true,
					name: true,
				},
			},
			_count: {
				select: { workAssignments: true },
			},
		},
	});

	const totalWorkOrderCount = await prisma.workOrder.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: allWorkOrders,
		meta: {
			page: page,
			limit: limit,
			total: totalWorkOrderCount,
			totalPages: Math.ceil(totalWorkOrderCount / limit),
		},
	};
};

const getWorkOrderById = async (workOrderId: string, user: RequestUser) => {
	const workOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					contactNumber: true,
					address: true,
				},
			},
			category: {
				select: {
					id: true,
					name: true,
					description: true,
				},
			},
			workAssignments: {
				where: { isDeleted: false },
				orderBy: { createdAt: "desc" },
				include: {
					vendor: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					technician: {
						select: {
							id: true,
							name: true,
							email: true,
							contactNumber: true,
						},
					},
				},
			},
		},
	});

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	// Role-based access control (vendor isolation)
	if (user.role === "ADMIN") {
		return workOrder;
	}

	if (user.role === "CUSTOMER") {
		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (!customer || customer.id !== workOrder.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view your own work orders",
			);
		}

		return workOrder;
	}

	if (user.role === "TECHNICIAN") {
		const technician = await prisma.technician.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		const isAssigned =
			technician &&
			workOrder.workAssignments.some(
				(assignment) => assignment.technicianId === technician.id,
			);

		if (!isAssigned) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view work orders assigned to you",
			);
		}

		return workOrder;
	}

	throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
};

const updateWorkOrder = async (
	workOrderId: string,
	payload: IUpdateWorkOrderPayload,
) => {
	const existingWorkOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		select: { id: true, version: true },
	});

	if (!existingWorkOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (payload.categoryId) {
		const category = await prisma.serviceCategory.findUnique({
			where: { id: payload.categoryId, isDeleted: false, isActive: true },
		});

		if (!category) {
			throw new AppError(httpStatus.NOT_FOUND, "Service category not found");
		}
	}

	// Optimistic concurrency control: only update if version matches
	const updateResult = await prisma.workOrder.updateMany({
		where: { id: workOrderId, version: payload.version },
		data: {
			...(payload.title !== undefined && { title: payload.title }),
			...(payload.description !== undefined && {
				description: payload.description,
			}),
			...(payload.categoryId !== undefined && {
				categoryId: payload.categoryId,
			}),
			...(payload.priority !== undefined && { priority: payload.priority }),
			...(payload.scheduledAt !== undefined && {
				scheduledAt: new Date(payload.scheduledAt),
			}),
			...(payload.latitude !== undefined && { latitude: payload.latitude }),
			...(payload.longitude !== undefined && {
				longitude: payload.longitude,
			}),
			version: { increment: 1 },
		},
	});

	if (updateResult.count === 0) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Work order was already modified. Please refresh and try again.",
		);
	}

	const updatedWorkOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId },
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			category: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return updatedWorkOrder;
};

const updateWorkOrderStatus = async (
	workOrderId: string,
	payload: IUpdateWorkOrderStatusPayload,
	user: RequestUser,
) => {
	const workOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			workAssignments: {
				where: { isDeleted: false },
				orderBy: { createdAt: "desc" },
				take: 1,
			},
		},
	});

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	const { status: newStatus } = payload;
	const currentStatus = workOrder.status;
	const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];
	if (!allowedTransitions.includes(newStatus)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Cannot transition work order from ${currentStatus} to ${newStatus}`,
		);
	}

	if (newStatus === WorkOrderStatus.APPROVED && user.role !== "ADMIN") {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only an admin can approve work orders",
		);
	}

	if (newStatus === WorkOrderStatus.ASSIGNED && user.role !== "ADMIN") {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only an admin can assign work orders",
		);
	}

	const technicianOnlyTransitions: WorkOrderStatus[] = [
		WorkOrderStatus.ACCEPTED,
		WorkOrderStatus.EN_ROUTE,
		WorkOrderStatus.IN_PROGRESS,
		WorkOrderStatus.COMPLETED,
		WorkOrderStatus.FAILED,
	];

	if (
		technicianOnlyTransitions.includes(newStatus) &&
		user.role !== "TECHNICIAN"
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a technician can perform this action",
		);
	}

	if (user.role === "TECHNICIAN") {
		const technician = await prisma.technician.findUnique({
			where: { userId: user.userId },
		});

		if (!technician) {
			throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
		}

		const latestAssignment = workOrder.workAssignments[0];

		if (
			!latestAssignment ||
			latestAssignment.technicianId !== technician.id ||
			latestAssignment.status !== AssignmentStatus.ACCEPTED
		) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You are not the assigned technician for this work order",
			);
		}
	}

	if (
		newStatus === WorkOrderStatus.CANCELLED &&
		user.role !== "ADMIN" &&
		user.role !== "CUSTOMER"
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only an admin or the owning customer can cancel a work order",
		);
	}

	if (newStatus === WorkOrderStatus.CANCELLED && user.role === "CUSTOMER") {
		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
		});

		if (!customer || customer.id !== workOrder.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only cancel your own work orders",
			);
		}

		if (
			currentStatus !== WorkOrderStatus.PENDING &&
			currentStatus !== WorkOrderStatus.APPROVED
		) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Customer can only cancel PENDING or APPROVED work orders",
			);
		}
	}

	// Optimistic concurrency control: only transition if version matches
	const transitionResult = await prisma.workOrder.updateMany({
		where: { id: workOrderId, version: payload.version },
		data: {
			status: newStatus,
			...(newStatus === WorkOrderStatus.CANCELLED && {
				cancellationReason: payload.cancellationReason,
			}),
			...(newStatus === WorkOrderStatus.COMPLETED && {
				completedAt: new Date(),
			}),
			version: { increment: 1 },
		},
	});

	if (transitionResult.count === 0) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Work order was already modified. Please refresh and try again.",
		);
	}

	const updatedWorkOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId },
	});

	return updatedWorkOrder;
};

const getMyAssignedWorkOrders = async (user: RequestUser) => {
	const technician = await prisma.technician.findUnique({
		where: { userId: user.userId },
		select: { id: true },
	});

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
	}

	const workOrders = await prisma.workOrder.findMany({
		where: {
			isDeleted: false,
			status: {
				in: [
					WorkOrderStatus.ASSIGNED,
					WorkOrderStatus.ACCEPTED,
					WorkOrderStatus.EN_ROUTE,
					WorkOrderStatus.IN_PROGRESS,
				],
			},
			workAssignments: {
				some: {
					technicianId: technician.id,
					isDeleted: false,
					status: {
						in: [AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED],
					},
				},
			},
		},
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					contactNumber: true,
					address: true,
				},
			},
			category: {
				select: {
					id: true,
					name: true,
				},
			},
			workAssignments: {
				where: { isDeleted: false, technicianId: technician.id },
				include: {
					vendor: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return workOrders;
};

const deleteWorkOrder = async (workOrderId: string) => {
	const existingWorkOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
	});

	if (!existingWorkOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	await prisma.workOrder.update({
		where: { id: workOrderId },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
		},
	});

	return null;
};

export const WorkOrderService = {
	createWorkOrder,
	getAllWorkOrders,
	getWorkOrderById,
	updateWorkOrder,
	updateWorkOrderStatus,
	getMyAssignedWorkOrders,
	deleteWorkOrder,
};
