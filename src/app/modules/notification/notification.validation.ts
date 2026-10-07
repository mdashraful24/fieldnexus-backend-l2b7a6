import z from "zod";

const NotificationQueryZodSchema = z.object({
	page: z.string().regex(/^\d+$/, "Page must be a positive number").optional(),
	limit: z
		.string()
		.regex(/^\d+$/, "Limit must be a positive number")
		.optional(),
	isRead: z.enum(["true", "false"]).optional(),
});

export const notificationValidation = {
	NotificationQueryZodSchema,
};
