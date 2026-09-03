export interface ICreateVendorPayload {
	name: string;
	email: string;
	phone?: string;
	description?: string;
	address?: string;
	serviceAreas?: string;
}

export interface IUpdateVendorPayload {
	name?: string;
	email?: string;
	phone?: string;
	description?: string;
	address?: string;
	serviceAreas?: string;
}
