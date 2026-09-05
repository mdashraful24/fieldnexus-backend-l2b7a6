import httpStatus from "http-status";
import { VendorWhereInput } from "../../../generated/prisma/models";
import { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IAddVendorMemberPayload,
	ICreateVendorPayload,
	IUpdateVendorPayload,
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

const getAllVendors = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: VendorWhereInput[] = [];

	// Add search term condition if provided
	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					name: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					email: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	// Add any other filter conditions based on the query parameters
	if (query.email) {
		andConditions.push({
			email: { equals: query.email, mode: "insensitive" },
		});
	}

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	const whereCondition: VendorWhereInput = {
		AND: andConditions,
	};

	const allVendors = await prisma.vendor.findMany({
		where: whereCondition,

		// dynamic pagination and sorting
		take: limit,
		skip: skip,

		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const totalVendorCount = await prisma.vendor.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: allVendors,
		meta: {
			page: page,
			limit: limit,
			total: totalVendorCount,
			totalPages: Math.ceil(totalVendorCount / limit),
		},
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

const restoreVendor = async (vendorId: string) => {
	const existingVendor = await prisma.vendor.findUnique({
		where: { id: vendorId },
	});

	if (!existingVendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	if (!existingVendor.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Vendor is not deleted, nothing to restore",
		);
	}

	const restoredVendor = await prisma.vendor.update({
		where: { id: vendorId },
		data: {
			isDeleted: false,
			deletedAt: null,
		},
	});

	return restoredVendor;
};

const addMember = async (
	vendorId: string,
	payload: IAddVendorMemberPayload,
) => {
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	const technician = await prisma.technician.findUnique({
		where: { id: payload.technicianId, isDeleted: false },
	});

	if (!technician) {
		throw new AppError(httpStatus.NOT_FOUND, "Technician not found");
	}

	const existingMember = await prisma.vendorMember.findUnique({
		where: {
			vendorId_technicianId: {
				vendorId,
				technicianId: payload.technicianId,
			},
		},
	});

	if (existingMember) {
		if (existingMember.isDeleted) {
			const restored = await prisma.vendorMember.update({
				where: { id: existingMember.id },
				data: { isDeleted: false, deletedAt: null, isActive: true },
				include: {
					technician: {
						select: {
							id: true,
							name: true,
							email: true,
							contactNumber: true,
						},
					},
				},
			});
			return restored;
		}

		if (existingMember.isActive) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Technician is already an active member of this vendor",
			);
		}

		const reactivated = await prisma.vendorMember.update({
			where: { id: existingMember.id },
			data: { isActive: true },
			include: {
				technician: {
					select: {
						id: true,
						name: true,
						email: true,
						contactNumber: true,
					},
				},
			},
		});
		return reactivated;
	}

	const member = await prisma.vendorMember.create({
		data: {
			vendorId,
			technicianId: payload.technicianId,
		},
		include: {
			technician: {
				select: {
					id: true,
					name: true,
					email: true,
					contactNumber: true,
				},
			},
		},
	});

	return member;
};

const getMembers = async (vendorId: string) => {
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	const members = await prisma.vendorMember.findMany({
		where: {
			vendorId,
			isDeleted: false,
		},
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
		orderBy: { createdAt: "desc" },
	});

	return members;
};

const removeMember = async (vendorId: string, technicianId: string) => {
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	const member = await prisma.vendorMember.findUnique({
		where: {
			vendorId_technicianId: {
				vendorId,
				technicianId,
			},
		},
	});

	if (!member || member.isDeleted) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician is not a member of this vendor",
		);
	}

	await prisma.vendorMember.update({
		where: { id: member.id },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
			isActive: false,
		},
	});

	return null;
};

const restoreMember = async (vendorId: string, technicianId: string) => {
	const vendor = await prisma.vendor.findUnique({
		where: { id: vendorId, isDeleted: false },
	});

	if (!vendor) {
		throw new AppError(httpStatus.NOT_FOUND, "Vendor not found");
	}

	const member = await prisma.vendorMember.findUnique({
		where: {
			vendorId_technicianId: {
				vendorId,
				technicianId,
			},
		},
	});

	if (!member) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Technician is not a member of this vendor",
		);
	}

	if (!member.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Vendor member is not deleted, nothing to restore",
		);
	}

	const restoredMember = await prisma.vendorMember.update({
		where: { id: member.id },
		data: {
			isDeleted: false,
			deletedAt: null,
			isActive: true,
		},
	});

	return restoredMember;
};

export const VendorService = {
	createVendor,
	getAllVendors,
	getVendorById,
	updateVendor,
	deleteVendor,
	restoreVendor,
	addMember,
	getMembers,
	removeMember,
	restoreMember,
};
