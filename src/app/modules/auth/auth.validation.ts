import z from "zod";

const password = z
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
	})

const RegistrationZodSchema = z.object({
	name: z
		.string("Not a valid name")
		.min(3, "Name must be at least 3 characters long.")
		.max(50, "Name must not exceed 50 characters."),
	email: z.string().email("Not a valid email address"),
	contactNumber: z
		.string()
		.refine((val) => val === "" || /^(?:\+?880|0)1[3-9]\d{8}$/.test(val), {
			message: "Please enter a valid Bangladeshi number",
		})
		.optional(),
	password,
	address: z.string().optional(),
});

// * GP - 017, 013
// * BL - 019, 014
// * Airtel or cirkle - 016
// * Robi - 018
// * Teletalk - 015
// ! City Cell - o11 (Already closed)
// ! There is no 012 operator in Bangladesh
// todo: We need to confirm from [3-9] that the contact number is valid or not. Because there are some operators that are not in use anymore. So we need to confirm from [3-9] that the contact number is valid or not.
// ? Either +880, 880, or 0 can be used as the prefix for the contact number. So we need to confirm from [3-9] that the contact number is valid or not. Because there are some operators that are not in use anymore. So we need to confirm from [3-9] that the contact number is valid or not.

const EmailVerificationZodSchema = z.object({
	email: z.string().email("Not a valid email address"),
	otp: z.string().length(6, { message: "OTP must be 6 digits long" }),
});

const ResendRegistrationOtpZodSchema = z.object({
	email: z.string().email("Not a valid email address"),
});

const UserLoginZodSchema = z.object({
	email: z.string().email("Not a valid email address"),
	password,
});

const ForgotPassword = z.object({
	email: z.string().email("Not a valid email address"),
});

const ResetPassword = z.object({
	email: z.string().email("Not a valid email address"),
	otp: z.string().length(6, { message: "OTP must be 6 digits long" }),
	newPassword: password,
});

export const userAuthValidation = {
	RegistrationZodSchema,
	EmailVerificationZodSchema,
	ResendRegistrationOtpZodSchema,
	UserLoginZodSchema,
	ForgotPassword,
	ResetPassword,
};
