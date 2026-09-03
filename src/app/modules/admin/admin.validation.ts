import z from "zod";

const UpdateUserStatusZodSchema = z.object({
	status: z.enum(["ACTIVE", "BLOCKED", "DELETED"], {
		message: "Status must be ACTIVE, BLOCKED, or DELETED",
	}),
});

export const adminValidation = {
	UpdateUserStatusZodSchema,
};
