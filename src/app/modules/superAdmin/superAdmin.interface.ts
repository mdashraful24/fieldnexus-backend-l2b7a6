import type { UserStatus } from "../../../generated/prisma/enums";

export interface ICreateAdminPayload {
	name: string;
	email: string;
	password: string;
	contactNumber?: string;
	imageUrl?: string;
}

export interface IUpdateAdminStatusPayload {
	status: UserStatus;
}

export interface IResetAdminPasswordPayload {
	newPassword: string;
}

export interface IChangeAdminEmailPayload {
	newEmail: string;
}
