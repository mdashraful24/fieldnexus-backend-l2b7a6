import httpStatus from "http-status";
import { WorkOrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateFeedbackPayload } from "./feedback.interface";

const createFeedback = async (
	workOrderId: string,
	payload: ICreateFeedbackPayload,
	user: RequestUser,
) => {
	const customer = await prisma.customer.findUnique({
		where: { userId: user.userId },
		select: { id: true },
	});

	if (!customer) {
		throw new AppError(httpStatus.NOT_FOUND, "Customer profile not found");
	}

	const workOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			feedback: true,
			workAssignments: {
				where: { isDeleted: false },
			},
		},
	});

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (customer.id !== workOrder.customerId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only submit feedback for your own work orders",
		);
	}

	if (workOrder.status !== WorkOrderStatus.COMPLETED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Feedback can only be submitted for COMPLETED work orders",
		);
	}

	if (workOrder.feedback) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Feedback already exists for this work order",
		);
	}

	const feedback = await prisma.feedback.create({
		data: {
			workOrderId,
			customerId: customer.id,
			rating: payload.rating,
			comment: payload.comment,
		},
		include: {
			customer: {
				select: { id: true, name: true },
			},
			workOrder: {
				select: {
					id: true,
					workOrderNumber: true,
					title: true,
				},
			},
		},
	});

	return feedback;
};

const getFeedback = async (workOrderId: string, user: RequestUser) => {
	const workOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			feedback: {
				include: {
					customer: {
						select: { id: true, name: true },
					},
				},
			},
			workAssignments: {
				where: { isDeleted: false },
			},
		},
	});

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (user.role === "ADMIN") {
		return workOrder.feedback;
	}

	if (user.role === "CUSTOMER") {
		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (!customer || customer.id !== workOrder.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view feedback for your own work orders",
			);
		}

		return workOrder.feedback;
	}

	if (user.role === "TECHNICIAN") {
		const technician = await prisma.technician.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		const isAssignedTechnician =
			technician &&
			workOrder.workAssignments.some(
				(assignment) => assignment.technicianId === technician.id,
			);

		if (!isAssignedTechnician) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view feedback for work orders assigned to you",
			);
		}

		return workOrder.feedback;
	}

	throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
};

export const FeedbackService = {
	createFeedback,
	getFeedback,
};
