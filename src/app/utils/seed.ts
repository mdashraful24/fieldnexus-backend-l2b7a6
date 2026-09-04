import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";

export const seedAdmin = async () => {
	try {
		const isAdminExist = await prisma.user.findFirst({
			where: {
				role: Role.ADMIN,
			},
		});

		if (isAdminExist) {
			console.log("Admin Already Exists!");
			return;
		}

		const name = config.field_nexus_admin_name;
		const email = config.field_nexus_admin_email;
		const password = config.field_nexus_admin_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Admin Credentials are not provided in the environment variables.",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				needPasswordChange: false,
				emailVerified: true,
			},
		});
		console.log("Admin Created : ", superAdmin);
	} catch (error) {
		console.log("Error Seeding Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.field_nexus_admin_email,
			},
		});
	}
};

export const seedTesterTechnician = async () => {
	try {
		const isTesterTechnicianExist = await prisma.user.findUnique({
			where: {
				email: config.tester_technician_email,
			},
		});

		if (isTesterTechnicianExist) {
			console.log("Tester Technician Already Exists!");
			return;
		}

		const name = config.tester_technician_name;
		const email = config.tester_technician_email;
		const password = config.tester_technician_password;

		if (!name || !email || !password) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Tester Technician Credentials are not provided in the environment variables.",
			);
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerTechnician = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.TECHNICIAN,
				needPasswordChange: false,
				emailVerified: true,
				technician: {
					create: {
						email,
						name,
						address: "123 Main St, City, Country",
						contactNumber: "123-456-7890",
						qualifications: "HSC",
						experienceYears: 5,
					},
				},
			},
		});
		console.log("Tester Technician Created : ", testerTechnician);
	} catch (error) {
		console.log("Error Seeding Tester Technician : ", error);

		await prisma.user.delete({
			where: {
				email: config.tester_technician_email,
			},
		});
	}
};

const TESTER_VENDOR_NAME = "Field Nexus Test Vendor";

export const seedTesterVendor = async () => {
	try {
		const existingVendor = await prisma.vendor.findFirst({
			where: { name: TESTER_VENDOR_NAME, isDeleted: false },
		});

		if (existingVendor) {
			console.log("Tester Vendor Already Exists!");
			return;
		}

		const technician = await prisma.technician.findUnique({
			where: { email: config.tester_technician_email },
		});

		if (!technician) {
			console.log("Tester Technician not found, skipping vendor seed.");
			return;
		}

		const vendor = await prisma.vendor.create({
			data: {
				name: TESTER_VENDOR_NAME,
				email: config.tester_technician_email,
				phone: technician.contactNumber,
				description: "Test vendor for development and testing purposes.",
				address: "123 Main St, City, Country",
				serviceAreas: "Dhaka, Gazipur, Narayanganj",
				members: {
					create: {
						technicianId: technician.id,
					},
				},
			},
			include: {
				members: true,
			},
		});

		console.log("Tester Vendor Created : ", vendor);
	} catch (error) {
		console.log("Error Seeding Tester Vendor : ", error);
	}
};
