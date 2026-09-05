import z from "zod";

const ApplyTechnicianApplicationZodSchema = z.object({
	name: z
		.string("Name is required")
		.trim()
		.min(2, "Name must be at least 2 characters long")
		.max(100, "Name must not exceed 100 characters"),

	email: z
		.string("Email is required")
		.trim()
		.email("Please provide a valid email address"),

	phone: z
		.string("Phone number is required")
		.trim()
		.min(7, "Phone number must be at least 7 characters long")
		.max(20, "Phone number must not exceed 20 characters")
		.optional(),

	address: z
		.string()
		.trim()
		.max(255, "Address must not exceed 255 characters")
		.optional(),

	qualifications: z
		.string("Qualifications are required")
		.trim()
		.min(2, "Qualifications are required")
		.max(500, "Qualifications must not exceed 500 characters"),

	experienceYears: z.coerce
		.number("Experience years is required")
		.int("Experience years must be a whole number")
		.min(0, "Experience years cannot be negative")
		.max(70, "Experience years must not exceed 70"),

	bio: z
		.string()
		.trim()
		.max(2000, "Bio must not exceed 2000 characters")
		.optional(),
});

const RejectApplicationZodSchema = z.object({
	rejectionReason: z
		.string("Rejection reason is required")
		.trim()
		.min(3, "Rejection reason must be at least 3 characters long")
		.max(500, "Rejection reason must not exceed 500 characters"),
});

const ApplicationIdParamsZodSchema = z.object({
	id: z.string().uuid("Application ID must be a valid UUID"),
});

export const technicianApplicationValidation = {
	ApplyTechnicianApplicationZodSchema,
	RejectApplicationZodSchema,
	ApplicationIdParamsZodSchema,
};
