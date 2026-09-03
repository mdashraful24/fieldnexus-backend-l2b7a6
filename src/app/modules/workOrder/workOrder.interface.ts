import {
	WorkOrderStatus,
	type WorkOrderPriority,
} from "../../../generated/prisma/enums";

export interface ICreateWorkOrderPayload {
	title: string;
	description?: string;
	categoryId: string;
	priority?: WorkOrderPriority;
	scheduledAt?: string;
	latitude?: number;
	longitude?: number;
}

export interface IUpdateWorkOrderPayload {
	title?: string;
	description?: string;
	categoryId?: string;
	priority?: WorkOrderPriority;
	scheduledAt?: string;
	latitude?: number;
	longitude?: number;
	version: number;
}

export interface IUpdateWorkOrderStatusPayload {
	status: WorkOrderStatus;
	cancellationReason?: string;
	version: number;
}

export const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
	[WorkOrderStatus.PENDING]: [
		WorkOrderStatus.APPROVED,
		WorkOrderStatus.CANCELLED,
	],
	[WorkOrderStatus.APPROVED]: [
		WorkOrderStatus.ASSIGNED,
		WorkOrderStatus.CANCELLED,
	],
	[WorkOrderStatus.ASSIGNED]: [
		WorkOrderStatus.ACCEPTED,
		WorkOrderStatus.REASSIGNED,
		WorkOrderStatus.CANCELLED,
	],
	[WorkOrderStatus.ACCEPTED]: [
		WorkOrderStatus.EN_ROUTE,
		WorkOrderStatus.CANCELLED,
	],
	[WorkOrderStatus.EN_ROUTE]: [WorkOrderStatus.IN_PROGRESS],
	[WorkOrderStatus.IN_PROGRESS]: [
		WorkOrderStatus.COMPLETED,
		WorkOrderStatus.FAILED,
	],
	[WorkOrderStatus.COMPLETED]: [],
	[WorkOrderStatus.CANCELLED]: [],
	[WorkOrderStatus.REASSIGNED]: [],
	[WorkOrderStatus.FAILED]: [],
};
