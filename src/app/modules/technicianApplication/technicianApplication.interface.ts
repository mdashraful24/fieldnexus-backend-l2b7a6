export interface IApplyAsTechnicianPayload {
	name: string;
	email: string;
	contactNumber?: string;
	address?: string;
	qualifications: string;
	experienceYears: number;
	bio?: string;
}

export interface IRejectApplicationPayload {
	rejectionReason: string;
}
