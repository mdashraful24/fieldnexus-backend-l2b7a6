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

export interface IVendorQueryParams {
	searchTerm?: string;
	page?: string;
	limit?: string;
	sortBy?: string;
	sortOrder?: string;
	status?: string;
}
