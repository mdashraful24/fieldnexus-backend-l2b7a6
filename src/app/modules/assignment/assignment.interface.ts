export interface IAssignWorkOrderPayload {
	vendorId: string;
	technicianId: string;
}

export interface IRejectAssignmentPayload {
	rejectionReason: string;
}
