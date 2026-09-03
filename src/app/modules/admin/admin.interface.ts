import type { UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateUserStatusPayload {
	status: UserStatus;
}
