import z from "zod";

const CreateServiceCategoryZodSchema = z.object({
	name: z
		.string("Name is required")
		.min(2, "Name must be at least 2 characters long.")
		.max(100, "Name must not exceed 100 characters."),
	description: z
		.string()
		.max(500, "Description must not exceed 500 characters.")
		.optional(),
	basePrice: z
		.number()
		.min(0, "Base price must be a positive number.")
		.optional(),
});

const UpdateServiceCategoryZodSchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters long.")
		.max(100, "Name must not exceed 100 characters.")
		.optional(),
	description: z
		.string()
		.max(500, "Description must not exceed 500 characters.")
		.optional(),
	basePrice: z
		.number()
		.min(0, "Base price must be a positive number.")
		.optional(),
	isActive: z.boolean().optional(),
});

export const serviceCategoryValidation = {
	CreateServiceCategoryZodSchema,
	UpdateServiceCategoryZodSchema,
};
