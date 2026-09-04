import z from "zod";
import {
	WorkOrderPriority,
	WorkOrderStatus,
} from "../../../generated/prisma/enums";

const CreateWorkOrderZodSchema = z.object({
	title: z
		.string("Title is required")
		.min(3, "Title must be at least 3 characters long.")
		.max(200, "Title must not exceed 200 characters."),
	description: z
		.string()
		.max(1000, "Description must not exceed 1000 characters.")
		.optional(),
	categoryId: z.string("Category is required"),
	priority: z
		.enum(
			[
				WorkOrderPriority.LOW,
				WorkOrderPriority.MEDIUM,
				WorkOrderPriority.HIGH,
				WorkOrderPriority.URGENT,
			],
			{ message: "Invalid priority" },
		)
		.optional(),
	scheduledAt: z.string().datetime().optional(),
	latitude: z.number().min(-90).max(90).optional(),
	longitude: z.number().min(-180).max(180).optional(),
});

const UpdateWorkOrderZodSchema = z.object({
	title: z
		.string("Title is required")
		.min(3, "Title must be at least 3 characters long.")
		.max(200, "Title must not exceed 200 characters.")
		.optional(),
	description: z
		.string()
		.max(1000, "Description must not exceed 1000 characters.")
		.optional(),
	categoryId: z.string("Category is required").optional(),
	priority: z
		.enum(
			[
				WorkOrderPriority.LOW,
				WorkOrderPriority.MEDIUM,
				WorkOrderPriority.HIGH,
				WorkOrderPriority.URGENT,
			],
			{ message: "Invalid priority" },
		)
		.optional(),
	scheduledAt: z.string().datetime().optional(),
	latitude: z.number().min(-90).max(90).optional(),
	longitude: z.number().min(-180).max(180).optional(),
	version: z.number("Version is required for optimistic locking").int().min(0),
});

const UpdateWorkOrderStatusZodSchema = z.object({
	status: z.enum(
		[
			WorkOrderStatus.PENDING,
			WorkOrderStatus.APPROVED,
			WorkOrderStatus.ASSIGNED,
			WorkOrderStatus.ACCEPTED,
			WorkOrderStatus.EN_ROUTE,
			WorkOrderStatus.IN_PROGRESS,
			WorkOrderStatus.COMPLETED,
			WorkOrderStatus.CANCELLED,
			WorkOrderStatus.REASSIGNED,
			WorkOrderStatus.FAILED,
		],
		{ message: "Invalid status" },
	),
	cancellationReason: z
		.string()
		.max(500, "Cancellation reason must not exceed 500 characters.")
		.optional(),
	version: z.number("Version is required for optimistic locking").int().min(0),
});

const CreateServiceReportZodSchema = z.object({
	workDescription: z
		.string("Work description is required")
		.min(10, "Work description must be at least 10 characters long.")
		.max(2000, "Work description must not exceed 2000 characters."),
	issueFound: z
		.string()
		.max(1000, "Issue found must not exceed 1000 characters.")
		.optional(),
	solutionProvided: z
		.string()
		.max(2000, "Solution provided must not exceed 2000 characters.")
		.optional(),
	partsUsed: z
		.array(
			z.object({
				name: z.string("Part name is required"),
				quantity: z.number("Quantity is required").int().min(1),
			}),
			{ message: "Parts used must be an array of parts" },
		)
		.optional(),
	hoursWorked: z
		.number("Hours worked is required")
		.min(0.5, "Hours worked must be at least 0.5.")
		.max(24, "Hours worked must not exceed 24."),
});

const WorkOrderIdZodSchema = z.object({
	id: z.string("Work order id is required"),
});

export const workOrderValidation = {
	CreateWorkOrderZodSchema,
	UpdateWorkOrderZodSchema,
	UpdateWorkOrderStatusZodSchema,
	CreateServiceReportZodSchema,
	WorkOrderIdZodSchema,
};
