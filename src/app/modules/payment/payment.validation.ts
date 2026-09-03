import z from "zod";

const InitiatePaymentZodSchema = z.object({
	workOrderId: z.string("Work order id is required"),
	payerReference: z
		.string()
		.regex(/^01[3-9]\d{8}$/, "Must be a valid Bangladeshi mobile number.")
		.optional(),
});

export const paymentValidation = {
	InitiatePaymentZodSchema,
};
