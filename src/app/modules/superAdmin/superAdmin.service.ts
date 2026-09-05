import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import type { UserWhereInput } from "../../../generated/prisma/models";
import config from "../../config";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	ICreateAdminPayload,
	IUpdateAdminProfilePayload,
	IUpdateAdminStatusPayload,
} from "./superAdmin.interface";

const adminRoles = [Role.ADMIN, Role.SUPER_ADMIN];

const adminSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	status: true,
	imageUrl: true,
	imagePublicId: true,
	emailVerified: true,
	needPasswordChange: true,
	createdAt: true,
	updatedAt: true,
} as const;

const getAllAdmins = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: UserWhereInput[] = [{ role: { in: adminRoles } }];

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andConditions.push({
			status: { equals: query.status as never },
		});
	}

	if (query.role) {
		andConditions.push({
			role: { equals: query.role as never },
		});
	}

	const where: UserWhereInput = { AND: andConditions };

	const [admins, total] = await prisma.$transaction([
		prisma.user.findMany({
			where,
			select: adminSelect,
			take: limit,
			skip,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),
		prisma.user.count({ where }),
	]);

	return {
		data: admins,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getAdminById = async (adminId: string) => {
	const admin = await prisma.user.findFirst({
		where: { id: adminId, isDeleted: false, role: { in: adminRoles } },
		select: adminSelect,
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	return admin;
};

const createAdmin = async (
	payload: ICreateAdminPayload,
	actor: RequestUser,
	ipAddress?: string,
) => {
	const email = payload.email.trim().toLowerCase();

	const existingUser = await prisma.user.findUnique({
		where: { email },
	});

	if (existingUser) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User with this email already exists",
		);
	}

	const hashedPassword = await bcrypt.hash(
		payload.password,
		Number(config.bcrypt_salt_rounds),
	);

	const admin = await prisma.user.create({
		data: {
			name: payload.name,
			email,
			password: hashedPassword,
			role: payload.role ?? Role.ADMIN,
			status: UserStatus.ACTIVE,
			emailVerified: true,
			needPasswordChange: true,
			imageUrl: payload.imageUrl ?? "",
		},
		select: adminSelect,
	});

	await prisma.auditLog.create({
		data: {
			action: "ADMIN_CREATED",
			entityType: "User",
			entityId: admin.id,
			ipAddress: ipAddress ?? null,
			newValue: {
				name: admin.name,
				email: admin.email,
				role: admin.role,
			},
			userId: actor.userId,
		},
	});

	return admin;
};

const updateAdminStatus = async (
	adminId: string,
	payload: IUpdateAdminStatusPayload,
	actor: RequestUser,
	ipAddress?: string,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: adminId },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	if (admin.role !== Role.ADMIN && admin.role !== Role.SUPER_ADMIN) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	if (admin.id === actor.userId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You cannot update the status of your own account",
		);
	}

	if (admin.role === Role.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You cannot update the status of a super admin",
		);
	}

	if (admin.isDeleted && payload.status === UserStatus.DELETED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Admin is already deleted. Use the restore endpoint to reactivate the admin.",
		);
	}

	const updatedAdmin = await prisma.user.update({
		where: { id: admin.id },
		data: {
			status: payload.status,
			...(payload.status === UserStatus.DELETED
				? { isDeleted: true, deletedAt: new Date() }
				: { isDeleted: false, deletedAt: null }),
		},
		select: adminSelect,
	});

	await prisma.auditLog.create({
		data: {
			action: "ADMIN_STATUS_UPDATED",
			entityType: "User",
			entityId: admin.id,
			ipAddress: ipAddress ?? null,
			oldValue: { status: admin.status, isDeleted: admin.isDeleted },
			newValue: {
				status: updatedAdmin.status,
				isDeleted: updatedAdmin.status === UserStatus.DELETED,
			},
			userId: actor.userId,
		},
	});

	return updatedAdmin;
};

const restoreAdmin = async (
	adminId: string,
	actor: RequestUser,
	ipAddress?: string,
) => {
	const admin = await prisma.user.findUnique({
		where: { id: adminId },
	});

	if (
		!admin ||
		(admin.role !== Role.ADMIN && admin.role !== Role.SUPER_ADMIN)
	) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	if (!admin.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Admin is not deleted, nothing to restore",
		);
	}

	if (admin.role === Role.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You cannot restore a super admin",
		);
	}

	const restoredAdmin = await prisma.user.update({
		where: { id: admin.id },
		data: {
			status: UserStatus.ACTIVE,
			isDeleted: false,
			deletedAt: null,
		},
		select: adminSelect,
	});

	await prisma.auditLog.create({
		data: {
			action: "ADMIN_RESTORED",
			entityType: "User",
			entityId: admin.id,
			ipAddress: ipAddress ?? null,
			oldValue: { status: admin.status, isDeleted: admin.isDeleted },
			newValue: { status: restoredAdmin.status, isDeleted: false },
			userId: actor.userId,
		},
	});

	return restoredAdmin;
};

const updateAdminProfile = async (
	adminId: string,
	payload: IUpdateAdminProfilePayload,
	actor: RequestUser,
	ipAddress?: string,
) => {
	const admin = await prisma.user.findFirst({
		where: { id: adminId, isDeleted: false, role: { in: adminRoles } },
	});

	if (!admin) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	if (
		admin.id === actor.userId &&
		payload.role &&
		payload.role !== admin.role
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"You cannot change the role of your own account",
		);
	}

	if (admin.role === Role.SUPER_ADMIN && payload.role === Role.ADMIN) {
		throw new AppError(httpStatus.FORBIDDEN, "You cannot demote a super admin");
	}

	const data: {
		name?: string;
		email?: string;
		password?: string;
		imageUrl?: string;
		role?: Role;
	} = {};

	if (payload.name) {
		data.name = payload.name;
	}

	if (payload.email) {
		const email = payload.email.trim().toLowerCase();

		const existingUser = await prisma.user.findFirst({
			where: { email, id: { not: admin.id } },
		});

		if (existingUser) {
			throw new AppError(
				httpStatus.CONFLICT,
				"User with this email already exists",
			);
		}

		data.email = email;
	}

	if (payload.password) {
		data.password = await bcrypt.hash(
			payload.password,
			Number(config.bcrypt_salt_rounds),
		);
	}

	if (payload.imageUrl) {
		data.imageUrl = payload.imageUrl;
	}

	if (payload.role) {
		data.role = payload.role;
	}

	const updatedAdmin = await prisma.user.update({
		where: { id: admin.id },
		data,
		select: adminSelect,
	});

	await prisma.auditLog.create({
		data: {
			action: "ADMIN_UPDATED",
			entityType: "User",
			entityId: admin.id,
			ipAddress: ipAddress ?? null,
			oldValue: {
				name: admin.name,
				email: admin.email,
				role: admin.role,
			},
			newValue: {
				name: updatedAdmin.name,
				email: updatedAdmin.email,
				role: updatedAdmin.role,
			},
			userId: actor.userId,
		},
	});

	return updatedAdmin;
};

export const SuperAdminService = {
	getAllAdmins,
	getAdminById,
	createAdmin,
	updateAdminStatus,
	restoreAdmin,
	updateAdminProfile,
};
