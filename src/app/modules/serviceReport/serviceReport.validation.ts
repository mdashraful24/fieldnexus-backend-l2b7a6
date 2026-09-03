import z from "zod";

const CreateServiceReportZodSchema = z.object({
	workDescription: z
		.string("Work description is required")
		.min(10, "Work description must be at least 10 characters long.")
		.max(2000, "Work description must not exceed 2000 characters."),
	issueFound: z
		.string()
		.max(1000, "Issue found must not exceed 1000 characters.")
		.optional(),
	solutionProvided: z
		.string()
		.max(2000, "Solution provided must not exceed 2000 characters.")
		.optional(),
	partsUsed: z
		.array(
			z.object({
				name: z.string("Part name is required"),
				quantity: z.number("Quantity is required").int().min(1),
			}),
			{ message: "Parts used must be an array of parts" },
		)
		.optional(),
	hoursWorked: z
		.number("Hours worked is required")
		.min(0.5, "Hours worked must be at least 0.5.")
		.max(24, "Hours worked must not exceed 24."),
});

export const serviceReportValidation = {
	CreateServiceReportZodSchema,
};
