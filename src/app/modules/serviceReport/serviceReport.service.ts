import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { WorkOrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import type { ICreateServiceReportPayload } from "./serviceReport.interface";

const createServiceReport = async (
	workOrderId: string,
	payload: ICreateServiceReportPayload,
	user: RequestUser,
) => {
	const technician = await prisma.technician.findUnique({
		where: { userId: user.userId },
		select: { id: true },
	});

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
	}

	const workOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			serviceReport: true,
			workAssignments: {
				where: { isDeleted: false },
			},
		},
	});

	if (!workOrder) {
		throw new AppError(httpStatus.NOT_FOUND, "Work order not found");
	}

	if (
		workOrder.status !== WorkOrderStatus.IN_PROGRESS &&
		workOrder.status !== WorkOrderStatus.COMPLETED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Service report can only be submitted for IN_PROGRESS or COMPLETED work orders",
		);
	}

	if (workOrder.serviceReport) {
		throw new AppError(
			httpStatus.CONFLICT,
			"A service report already exists for this work order",
		);
	}

	const isAssignedTechnician = workOrder.workAssignments.some(
		(assignment) => assignment.technicianId === technician.id,
	);

	if (!isAssignedTechnician) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only the assigned technician can submit a service report",
		);
	}

	const serviceReport = await prisma.serviceReport.create({
		data: {
			workOrderId,
			technicianId: technician.id,
			workDescription: payload.workDescription,
			issueFound: payload.issueFound,
			solutionProvided: payload.solutionProvided,
			partsUsed: payload.partsUsed as Prisma.InputJsonValue,
			hoursWorked: payload.hoursWorked,
		},
		include: {
			technician: {
				select: { id: true, name: true, contactNumber: true },
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

	return serviceReport;
};

const getServiceReport = async (workOrderId: string, user: RequestUser) => {
	const workOrder = await prisma.workOrder.findUnique({
		where: { id: workOrderId, isDeleted: false },
		include: {
			serviceReport: {
				include: {
					technician: {
						select: { id: true, name: true, contactNumber: true },
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

	// Role-based access control
	if (user.role === "ADMIN") {
		return workOrder.serviceReport;
	}

	if (user.role === "CUSTOMER") {
		const customer = await prisma.customer.findUnique({
			where: { userId: user.userId },
			select: { id: true },
		});

		if (!customer || customer.id !== workOrder.customerId) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only view reports for your own work orders",
			);
		}

		return workOrder.serviceReport;
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
				"You can only view reports for work orders assigned to you",
			);
		}

		return workOrder.serviceReport;
	}

	throw new AppError(httpStatus.FORBIDDEN, "Forbidden");
};

export const ServiceReportService = {
	createServiceReport,
	getServiceReport,
};
