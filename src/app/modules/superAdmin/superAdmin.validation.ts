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
		.string("Not a valid name")
		.min(3, "Name must be at least 3 characters long.")
		.max(10, "Name must not exceed 10 characters."),
	email: z.string().email("Not a valid email address"),
	contactNumber: z
		.string()
		.refine((val) => val === "" || /^(?:\+?880|0)1[3-9]\d{8}$/.test(val), {
			message: "Please enter a valid Bangladeshi number",
		})
		.optional(),
	password: passwordRegex,
	imageUrl: z.string().optional(),
});

const UpdateAdminStatusZodSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED", "DELETED"], {
		message: "Status must be ACTIVE, BLOCKED, or DELETED",
	}),
});

const ResetAdminPasswordZodSchema = z.object({
	newPassword: passwordRegex,
});

const ChangeAdminEmailZodSchema = z.object({
	newEmail: z
		.string("Email must be a string")
		.email("Not a valid email address"),
});

export const superAdminValidation = {
	CreateAdminZodSchema,
	UpdateAdminStatusZodSchema,
	ResetAdminPasswordZodSchema,
	ChangeAdminEmailZodSchema,
};
