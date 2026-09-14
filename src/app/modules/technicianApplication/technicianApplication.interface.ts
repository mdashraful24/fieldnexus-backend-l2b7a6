export interface IApplyAsTechnicianPayload {
	name: string;
	email: string;
	contactNumber?: string;
	address?: string;
	qualifications: string;
	experienceYears: number;
	skills?: string[];
	bio?: string;
}

export interface IRejectApplicationPayload {
	rejectionReason: string;
}
