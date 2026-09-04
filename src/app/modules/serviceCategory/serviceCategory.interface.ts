export interface ICreateServiceCategoryPayload {
	name: string;
	description?: string;
	basePrice?: number;
}

export interface IUpdateServiceCategoryPayload {
	name?: string;
	description?: string;
	basePrice?: number;
	isActive?: boolean;
}
