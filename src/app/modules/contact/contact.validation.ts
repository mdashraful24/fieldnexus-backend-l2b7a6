import z from "zod";

const CreateContactMessageZodSchema = z.object({
	name: z
		.string("Name is required")
		.min(2, "Name must be at least 2 characters long.")
		.max(100, "Name must not exceed 100 characters."),
	email: z.string("Email is required").email("Not a valid email address"),
	subject: z
		.string("Subject is required")
		.min(3, "Subject must be at least 3 characters long.")
		.max(150, "Subject must not exceed 150 characters."),
	message: z
		.string("Message is required")
		.min(10, "Message must be at least 10 characters long.")
		.max(2000, "Message must not exceed 2000 characters."),
});

const UpdateContactMessageZodSchema = z.object({
	isRead: z.boolean(),
});

export const contactValidation = {
	CreateContactMessageZodSchema,
	UpdateContactMessageZodSchema,
};
