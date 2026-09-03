import z from "zod";

const AssignWorkOrderZodSchema = z.object({
	vendorId: z.string("Vendor id is required"),
	technicianId: z.string("Technician id is required"),
});

const RejectAssignmentZodSchema = z.object({
	rejectionReason: z
		.string("Rejection reason is required")
		.min(3, "Rejection reason must be at least 3 characters long.")
		.max(500, "Rejection reason must not exceed 500 characters."),
});

export const assignmentValidation = {
	AssignWorkOrderZodSchema,
	RejectAssignmentZodSchema,
};
