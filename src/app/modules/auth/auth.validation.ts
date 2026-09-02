import z from "zod";

const RegistrationZodSchema = z.object({
	name: z
		.string("Not a valid name")
		.min(3, "Name must be at least 3 characters long.")
		.max(50, "Name must not exceed 50 characters."),
	email: z.string().email("Not a valid email address"),
	password: z
		.string()
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
		}),
	contactNumber: z.string().optional(),
	address: z.string().optional(),
});

const EmailVerificationZodSchema = z.object({
	email: z.string().email("Not a valid email address"),
	otp: z.string().length(6, { message: "OTP must be 6 digits long" }),
});

const UserLoginZodSchema = z.object({
	email: z.string().email("Not a valid email address"),
	password: z
		.string()
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
		}),
});

const ForgotPassword = z.object({
	email: z.string().email("Not a valid email address"),
});

const ResetPassword = z.object({
	email: z.string().email("Not a valid email address"),
	otp: z.string().length(6, { message: "OTP must be 6 digits long" }),
	newPassword: z
		.string()
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
		}),
});

export const userAuthValidation = {
	RegistrationZodSchema,
	EmailVerificationZodSchema,
	UserLoginZodSchema,
	ForgotPassword,
	ResetPassword,
};
