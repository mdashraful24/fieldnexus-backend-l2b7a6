import z from "zod";

const passwordRegex = z
	.string("Password must be a string")
	.min(8, { message: "Password must be at least 8 characters long." })
	.max(32, { message: "Password must not exceed 32 characters." })
	.regex(/[A-Z]/, {
		message: "Password must contain at least one uppercase letter.",
	})
	.regex(/[a-z]/, {
		message: "Password must contain at least one lowercase letter.",
	})
	.regex(/[0-9]/, { message: "Password must contain at least one number." })
	.regex(/[^A-Za-z0-9]/, {
		message: "Password must contain at least one special character.",
	});

const CreateAdminZodSchema = z.object({
	name: z
		.string("Name is required")
		.min(3, "Name must be at least 3 characters long.")
		.max(50, "Name must not exceed 50 characters."),
	email: z.string("Email is required").email("Not a valid email address"),
	password: passwordRegex,
	imageUrl: z.string().optional(),
	role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN").optional(),
});

const UpdateAdminStatusZodSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED", "DELETED"], {
		message: "Status must be ACTIVE, BLOCKED, or DELETED",
	}),
});

const UpdateAdminProfileZodSchema = z
	.object({
		name: z
			.string("Name must be a string")
			.min(3, "Name must be at least 3 characters long.")
			.max(50, "Name must not exceed 50 characters.")
			.optional(),
		email: z
			.string("Email must be a string")
			.email("Not a valid email address")
			.optional(),
		password: passwordRegex.optional(),
		imageUrl: z.string("Image URL must be a string").optional(),
		role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided to update",
	});

export const superAdminValidation = {
	CreateAdminZodSchema,
	UpdateAdminStatusZodSchema,
	UpdateAdminProfileZodSchema,
};
