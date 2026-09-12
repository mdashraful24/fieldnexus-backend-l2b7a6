import z from "zod";

const UpdateUserStatusZodSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED", "DELETED"], {
		message: "Status must be ACTIVE, BLOCKED, or DELETED",
	}),
});

const UserIdParamsSchema = z.object({
	id: z.string("Not a valid user id").min(1, "User id is required"),
});

export const adminValidation = {
	UpdateUserStatusZodSchema,
	UserIdParamsSchema,
};
