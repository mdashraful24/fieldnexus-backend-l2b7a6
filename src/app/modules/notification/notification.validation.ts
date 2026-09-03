import z from "zod";

const NotificationQueryZodSchema = z.object({
	page: z.string().regex(/^\d+$/, "Page must be a positive number").optional(),
	limit: z
		.string()
		.regex(/^\d+$/, "Limit must be a positive number")
		.optional(),
});

export const notificationValidation = {
	NotificationQueryZodSchema,
};
