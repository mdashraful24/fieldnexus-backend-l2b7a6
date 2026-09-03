export interface ICreateServiceReportPayload {
	workDescription: string;
	issueFound?: string;
	solutionProvided?: string;
	partsUsed?: unknown;
	hoursWorked: number;
}
