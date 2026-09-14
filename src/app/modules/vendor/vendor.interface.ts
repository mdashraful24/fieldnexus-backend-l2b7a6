export interface ICreateVendorPayload {
	name: string;
	email: string;
	contactNumber?: string;
	description?: string;
	address?: string;
	serviceAreas?: string;
}

export interface IUpdateVendorPayload {
	name?: string;
	email?: string;
	contactNumber?: string;
	description?: string;
	address?: string;
	serviceAreas?: string;
}

export interface IAddVendorMemberPayload {
	technicianId: string;
}
