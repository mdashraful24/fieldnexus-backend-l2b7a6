import httpStatus from "http-status";
import {
	AssignmentStatus,
	NotificationType,
	WorkOrderStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import { getAdminUserIds, notifyUsers } from "../../utils/notify";
import type { IAssignWorkOrderPayload } from "./assignment.interface";

const getTechnicianByUserId = (userId: string) =>
	prisma.technician.findUnique({ where: { userId } });

const getWorkOrder = (workOrderId: string) =>
	prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			customer: { select: { userId: true, name: true } },
			workAssignments: {
				where: { isDeleted: false },
				orderBy: { createdAt: "desc" },
			},
		},
	});

const getPendingAssignment = (workOrderId: string, technicianId: string) =>
	prisma.workAssignment.findFirst({
		where: {
			workOrderId,
			technicianId,
			isDeleted: false,
			status: AssignmentStatus.PENDING,
		},
	});

const hasSchedulingConflict = async (
	technicianId: string,
	scheduledAt: Date | null,
) => {
	if (!scheduledAt) {
		return false;
	}

	const activeAssignments = await prisma.workAssignment.findMany({
		where: {
			technicianId,
			isDeleted: false,
			status: { in: [AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED] },
			workOrder: {
				status: {
					in: [
						WorkOrderStatus.ASSIGNED,
						WorkOrderStatus.ACCEPTED,
						WorkOrderStatus.EN_ROUTE,
						WorkOrderStatus.IN_PROGRESS,
					],
				},
			},
		},
		include: { workOrder: { select: { scheduledAt: true } } },
	});

	// Overlap window of 3 hours for schedule conflict detection
	const overlapWindow = 3 * 60 * 60 * 1000;

	return activeAssignments.some(
		(a) =>
			a.workOrder.scheduledAt !== null &&
			Math.abs(a.workOrder.scheduledAt.getTime() - scheduledAt.getTime()) <
				overlapWindow,
	);
};

const assignWorkOrder = async (
	workOrderId: string,
	payload: IAssignWorkOrderPayload,
) => {
	const workOrder = await getWorkOrder(workOrderId);

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (
		workOrder.status !== WorkOrderStatus.APPROVED &&
		workOrder.status !== WorkOrderStatus.ASSIGNED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Work order must be APPROVED or ASSIGNED before assignment",
		);
	}

	const vendor = await prisma.vendor.findUnique({
		where: { id: payload.vendorId, isDeleted: false },
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	const technician = await prisma.technician.findUnique({
		where: { id: payload.technicianId, isDeleted: false },
	});

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
	}

	const vendorMember = await prisma.vendorMember.findUnique({
		where: {
			vendorId_technicianId: {
				vendorId: payload.vendorId,
				technicianId: payload.technicianId,
			},
		},
	});

	if (!vendorMember?.isActive) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Technician does not belong to the selected vendor",
		);
	}

	// Reassigning to the same technician is a no-op
	const alreadyAssigned = workOrder.workAssignments.some(
		(a) =>
			a.technicianId === payload.technicianId &&
			a.status === AssignmentStatus.ACCEPTED,
	);

	if (alreadyAssigned) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Technician is already assigned to this work order",
		);
	}

	const hasConflict = await hasSchedulingConflict(
		payload.technicianId,
		workOrder.scheduledAt,
	);

	if (hasConflict) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Technician has a scheduling conflict",
		);
	}

	const isReassign = workOrder.status === WorkOrderStatus.ASSIGNED;
	const cancelPreviousAssignments = isReassign ? workOrder.workAssignments : [];
	const cancelPrevious = cancelPreviousAssignments.map((a) =>
		prisma.workAssignment.update({
			where: { id: a.id },
			data: { status: AssignmentStatus.CANCELLED },
		}),
	);

	const [assignment] = await prisma.$transaction([
		prisma.workAssignment.create({
			data: {
				workOrderId,
				vendorId: payload.vendorId,
				technicianId: payload.technicianId,
				status: AssignmentStatus.PENDING,
			},
			include: {
				vendor: { select: { id: true, name: true } },
				technician: { select: { id: true, name: true, contactNumber: true } },
			},
		}),
		...cancelPrevious,
		prisma.workOrder.update({
			where: { id: workOrderId },
			data: { status: WorkOrderStatus.ASSIGNED },
		}),
	]);

	const orderLabel = `Work order ${workOrder.workOrderNumber} "${workOrder.title}"`;
	const assignmentType = isReassign
		? NotificationType.WORK_ORDER_REASSIGNED
		: NotificationType.WORK_ORDER_ASSIGNED;

	await notifyUsers(
		prisma,
		[technician.userId],
		assignmentType,
		isReassign
			? `You have been reassigned to ${orderLabel}.`
			: `You have been assigned ${orderLabel}.`,
	);

	await notifyUsers(
		prisma,
		[workOrder.customer.userId],
		assignmentType,
		isReassign
			? `${orderLabel} has been reassigned to ${technician.name}.`
			: `${orderLabel} has been assigned to ${technician.name}.`,
	);

	const previousTechnicianIds = cancelPreviousAssignments
		.map((a) => a.technicianId)
		.filter((technicianId) => technicianId !== payload.technicianId);

	if (previousTechnicianIds.length > 0) {
		const unassignedTechnicians = await prisma.technician.findMany({
			where: { id: { in: previousTechnicianIds } },
			select: { userId: true },
		});

		await notifyUsers(
			prisma,
			unassignedTechnicians.map((t) => t.userId),
			NotificationType.GENERAL,
			`You have been unassigned from ${orderLabel}.`,
		);
	}

	return assignment;
};

const acceptWorkOrder = async (workOrderId: string, user: RequestUser) => {
	const technician = await getTechnicianByUserId(user.userId);

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
	}

	const workOrder = await getWorkOrder(workOrderId);

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (workOrder.status !== WorkOrderStatus.ASSIGNED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only ASSIGNED work orders can be accepted",
		);
	}

	const assignment = await getPendingAssignment(workOrderId, technician.id);

	if (!assignment) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not the assigned technician for this work order",
		);
	}

	const [updatedAssignment] = await prisma.$transaction([
		prisma.workAssignment.update({
			where: { id: assignment.id },
			data: { status: AssignmentStatus.ACCEPTED, acceptedAt: new Date() },
		}),
		prisma.workOrder.update({
			where: { id: workOrderId },
			data: { status: WorkOrderStatus.ACCEPTED },
		}),
	]);

	await notifyUsers(
		prisma,
		[workOrder.customer.userId],
		NotificationType.WORK_ORDER_ACCEPTED,
		`${technician.name} accepted work order ${workOrder.workOrderNumber} "${workOrder.title}" and will carry out the service.`,
	);

	return updatedAssignment;
};

const rejectWorkOrder = async (
	workOrderId: string,
	rejectionReason: string,
	user: RequestUser,
) => {
	const technician = await getTechnicianByUserId(user.userId);

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
	}

	const workOrder = await getWorkOrder(workOrderId);

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (workOrder.status !== WorkOrderStatus.ASSIGNED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only ASSIGNED work orders can be rejected",
		);
	}

	const assignment = await getPendingAssignment(workOrderId, technician.id);

	if (!assignment) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not the assigned technician for this work order",
		);
	}

	const [rejectedAssignment] = await prisma.$transaction([
		prisma.workAssignment.update({
			where: { id: assignment.id },
			data: {
				status: AssignmentStatus.REJECTED,
				rejectionReason,
			},
		}),
		prisma.workOrder.update({
			where: { id: workOrderId },
			data: { status: WorkOrderStatus.APPROVED },
		}),
	]);

	const orderLabel = `Work order ${workOrder.workOrderNumber} "${workOrder.title}"`;

	await notifyUsers(
		prisma,
		await getAdminUserIds(),
		NotificationType.WORK_ORDER_REJECTED,
		`${technician.name} declined ${orderLabel}. Reason: ${rejectionReason} — please reassign another technician.`,
	);

	await notifyUsers(
		prisma,
		[workOrder.customer.userId],
		NotificationType.WORK_ORDER_REJECTED,
		`The assigned technician declined ${orderLabel}. We are arranging another technician.`,
	);

	return rejectedAssignment;
};

export const AssignmentService = {
	assignWorkOrder,
	acceptWorkOrder,
	rejectWorkOrder,
};
