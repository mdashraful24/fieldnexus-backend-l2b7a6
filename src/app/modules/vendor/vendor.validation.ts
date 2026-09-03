import z from "zod";

const CreateVendorZodSchema = z.object({
	name: z
		.string("Name is required")
		.min(2, "Name must be at least 2 characters long.")
		.max(100, "Name must not exceed 100 characters."),
	email: z.string("Email is required").email("Not a valid email address"),
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 characters long.")
		.max(15, "Phone number must not exceed 15 characters.")
		.optional(),
	description: z
		.string()
		.max(500, "Description must not exceed 500 characters.")
		.optional(),
	address: z
		.string()
		.max(200, "Address must not exceed 200 characters.")
		.optional(),
	serviceAreas: z
		.string()
		.max(300, "Service areas must not exceed 300 characters.")
		.optional(),
});

const UpdateVendorZodSchema = z.object({
	name: z
		.string("Name is required")
		.min(2, "Name must be at least 2 characters long.")
		.max(100, "Name must not exceed 100 characters.")
		.optional(),
	email: z
		.string("Email is required")
		.email("Not a valid email address")
		.optional(),
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 characters long.")
		.max(15, "Phone number must not exceed 15 characters.")
		.optional(),
	description: z
		.string()
		.max(500, "Description must not exceed 500 characters.")
		.optional(),
	address: z
		.string()
		.max(200, "Address must not exceed 200 characters.")
		.optional(),
	serviceAreas: z
		.string()
		.max(300, "Service areas must not exceed 300 characters.")
		.optional(),
});

const VendorStatusZodSchema = z.object({
	status: z.enum(["APPROVED", "SUSPENDED"], {
		message: "Status must be either APPROVED or SUSPENDED",
	}),
});

export const vendorValidation = {
	CreateVendorZodSchema,
	UpdateVendorZodSchema,
	VendorStatusZodSchema,
};
