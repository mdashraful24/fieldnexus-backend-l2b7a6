import z from "zod";

const InitiatePaymentZodSchema = z.object({
	workOrderId: z.string("Work order id is required"),
	payerReference: z
		.string()
		.regex(/^01[3-9]\d{8}$/, "Must be a valid Bangladeshi mobile number.")
		.optional(),
});

const RefundPaymentZodSchema = z.object({
	reason: z
		.string("Refund reason must be a string")
		.min(3, "Refund reason must be at least 3 characters long.")
		.max(500, "Refund reason must not exceed 500 characters.")
		.optional(),
});

export const paymentValidation = {
	InitiatePaymentZodSchema,
	RefundPaymentZodSchema,
};
