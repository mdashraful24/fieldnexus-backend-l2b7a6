export interface IApplyAsTechnicianPayload {
	name: string;
	email: string;
	phone?: string;
	address?: string;
	qualifications: string;
	experienceYears: number;
	bio?: string;
}

export interface IRejectApplicationPayload {
	rejectionReason: string;
}
