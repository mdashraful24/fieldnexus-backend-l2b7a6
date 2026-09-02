import z from "zod";

const UpdateUserProfileZodSchema = z.object({
	name: z
		.string("Not a valid name")
		.min(3, "Name must be at least 3 characters long.")
		.max(50, "Name must not exceed 50 characters.")
		.optional(),
	contactNumber: z.string().optional(),
	address: z.string().optional(),
});

export const userValidation = {
	UpdateUserProfileZodSchema,
};
