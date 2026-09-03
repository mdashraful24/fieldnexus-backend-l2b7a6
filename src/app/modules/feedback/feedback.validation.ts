import z from "zod";

const CreateFeedbackZodSchema = z.object({
	rating: z
		.number("Rating is required")
		.int("Rating must be an integer")
		.min(1, "Rating must be at least 1")
		.max(5, "Rating must not exceed 5"),
	comment: z
		.string()
		.max(1000, "Comment must not exceed 1000 characters.")
		.optional(),
});

export const feedbackValidation = {
	CreateFeedbackZodSchema,
};
