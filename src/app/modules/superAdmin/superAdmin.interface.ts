import type { UserStatus } from "../../../generated/prisma/enums";

export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export interface ICreateAdminPayload {
	name: string;
	email: string;
	password: string;
	imageUrl?: string;
	role?: AdminRole;
}

export interface IUpdateAdminStatusPayload {
	status: UserStatus;
}

export interface IUpdateAdminProfilePayload {
	name?: string;
	email?: string;
	password?: string;
	imageUrl?: string;
	role?: AdminRole;
}
