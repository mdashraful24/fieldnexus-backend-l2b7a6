import httpStatus from "http-status";
import type { ServiceCategoryWhereInput } from "../../../generated/prisma/models";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICreateServiceCategoryPayload,
	IUpdateServiceCategoryPayload,
} from "./serviceCategory.interface";

const createServiceCategory = async (
	payload: ICreateServiceCategoryPayload,
) => {
	const existingCategory = await prisma.serviceCategory.findFirst({
		where: { name: payload.name, isDeleted: false },
	});

	if (existingCategory) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Service category with this name already exists",
		);
	}

	const category = await prisma.serviceCategory.create({
		data: {
			name: payload.name,
			description: payload.description,
			basePrice: payload.basePrice,
		},
	});

	return category;
};

const getAllServiceCategories = async (query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: ServiceCategoryWhereInput[] = [];

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
					description: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (query.isActive !== undefined) {
		andConditions.push({
			isActive: query.isActive === "true",
		});
	}

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	const whereCondition: ServiceCategoryWhereInput = {
		AND: andConditions,
	};

	const allCategories = await prisma.serviceCategory.findMany({
		where: whereCondition,
		take: limit,
		skip: skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const totalCount = await prisma.serviceCategory.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: allCategories,
		meta: {
			page: page,
			limit: limit,
			total: totalCount,
			totalPages: Math.ceil(totalCount / limit),
		},
	};
};

const getServiceCategoryById = async (categoryId: string) => {
	const category = await prisma.serviceCategory.findUnique({
		where: { id: categoryId, isDeleted: false },
		include: {
			_count: {
				select: { workOrders: true },
			},
		},
	});

	if (!category) {
		throw new AppError(httpStatus.NOT_FOUND, "Service category not found");
	}

	return category;
};

const updateServiceCategory = async (
	categoryId: string,
	payload: IUpdateServiceCategoryPayload,
) => {
	const existingCategory = await prisma.serviceCategory.findUnique({
		where: { id: categoryId, isDeleted: false },
	});

	if (!existingCategory) {
		throw new AppError(httpStatus.NOT_FOUND, "Service category not found");
	}

	if (payload.name && payload.name !== existingCategory.name) {
		const duplicateName = await prisma.serviceCategory.findFirst({
			where: { name: payload.name, isDeleted: false },
		});

		if (duplicateName) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Another service category with this name already exists",
			);
		}
	}

	const updatedCategory = await prisma.serviceCategory.update({
		where: { id: categoryId },
		data: {
			...(payload.name !== undefined && { name: payload.name }),
			...(payload.description !== undefined && {
				description: payload.description,
			}),
			...(payload.basePrice !== undefined && {
				basePrice: payload.basePrice,
			}),
			...(payload.isActive !== undefined && {
				isActive: payload.isActive,
			}),
		},
	});

	return updatedCategory;
};

const deleteServiceCategory = async (categoryId: string) => {
	const existingCategory = await prisma.serviceCategory.findUnique({
		where: { id: categoryId, isDeleted: false },
	});

	if (!existingCategory) {
		throw new AppError(httpStatus.NOT_FOUND, "Service category not found");
	}

	await prisma.serviceCategory.update({
		where: { id: categoryId },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
		},
	});

	return null;
};

const restoreServiceCategory = async (categoryId: string) => {
	const existingCategory = await prisma.serviceCategory.findUnique({
		where: { id: categoryId },
	});

	if (!existingCategory) {
		throw new AppError(httpStatus.NOT_FOUND, "Service category not found");
	}

	if (!existingCategory.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Service category is not deleted, nothing to restore",
		);
	}

	const restoredCategory = await prisma.serviceCategory.update({
		where: { id: categoryId },
		data: {
			isDeleted: false,
			deletedAt: null,
			isActive: true,
		},
	});

	return restoredCategory;
};

export const ServiceCategoryService = {
	createServiceCategory,
	getAllServiceCategories,
	getServiceCategoryById,
	updateServiceCategory,
	deleteServiceCategory,
	restoreServiceCategory,
};
