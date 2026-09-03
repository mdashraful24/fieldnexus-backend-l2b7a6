import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { VendorStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateVendorPayload,
	IUpdateVendorPayload,
	IVendorQueryParams,
} from "./vendor.interface";

const createVendor = async (payload: ICreateVendorPayload) => {
	const existingVendor = await prisma.vendor.findUnique({
		where: { email: payload.email },
	});

	if (existingVendor) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Vendor with this email already exists",
		);
	}

	const vendor = await prisma.vendor.create({
		data: {
			name: payload.name,
			email: payload.email,
			phone: payload.phone,
			description: payload.description,
			address: payload.address,
			serviceAreas: payload.serviceAreas,
		},
	});

	return vendor;
};

const getAllVendors = async (query: IVendorQueryParams) => {
	const {
		searchTerm,
		page = "1",
		limit = "10",
		sortBy = "createdAt",
		sortOrder = "desc",
		status,
	} = query;

	const pageNum = Math.max(Number(page) || 1, 1);
	const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);
	const skip = (pageNum - 1) * limitNum;

	const where: Prisma.VendorWhereInput = {
		isDeleted: false,
	};

	if (searchTerm) {
		where.OR = [
			{ name: { contains: searchTerm, mode: "insensitive" } },
			{ email: { contains: searchTerm, mode: "insensitive" } },
			{ address: { contains: searchTerm, mode: "insensitive" } },
		];
	}

	if (status && Object.values(VendorStatus).includes(status as VendorStatus)) {
		where.status = status as VendorStatus;
	}

	const validSortFields = ["name", "email", "rating", "createdAt", "updatedAt"];
	const actualSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
	const actualSortOrder = sortOrder === "asc" ? "asc" : "desc";

	const [vendors, total] = await Promise.all([
		prisma.vendor.findMany({
			where,
			skip,
			take: limitNum,
			orderBy: { [actualSortBy]: actualSortOrder },
			include: {
				_count: {
					select: { members: true },
				},
			},
		}),
		prisma.vendor.count({ where }),
	]);

	return {
		meta: {
			page: pageNum,
			limit: limitNum,
			total,
			totalPages: Math.ceil(total / limitNum),
		},
		result: vendors,
	};
};

const getVendorById = async (vendorId: string) => {
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
		include: {
			members: {
				where: { isDeleted: false, isActive: true },
				include: {
					technician: {
						select: {
							id: true,
							name: true,
							email: true,
							contactNumber: true,
							qualifications: true,
							experienceYears: true,
						},
					},
				},
			},
			_count: {
				select: { members: true },
			},
		},
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	return vendor;
};

const updateVendor = async (
	vendorId: string,
	payload: IUpdateVendorPayload,
) => {
	const existingVendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!existingVendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	if (payload.email && payload.email !== existingVendor.email) {
		const duplicateEmail = await prisma.vendor.findUnique({
			where: { email: payload.email },
		});

		if (duplicateEmail) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Another vendor with this email already exists",
			);
		}
	}

	const updatedVendor = await prisma.vendor.update({
		where: { id: vendorId },
		data: {
			...(payload.name !== undefined && { name: payload.name }),
			...(payload.email !== undefined && { email: payload.email }),
			...(payload.phone !== undefined && { phone: payload.phone }),
			...(payload.description !== undefined && {
				description: payload.description,
			}),
			...(payload.address !== undefined && { address: payload.address }),
			...(payload.serviceAreas !== undefined && {
				serviceAreas: payload.serviceAreas,
			}),
		},
	});

	return updatedVendor;
};

const deleteVendor = async (vendorId: string) => {
	const existingVendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!existingVendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	await prisma.vendor.update({
		where: { id: vendorId },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
		},
	});

	return null;
};

export const VendorService = {
	createVendor,
	getAllVendors,
	getVendorById,
	updateVendor,
	deleteVendor,
};
