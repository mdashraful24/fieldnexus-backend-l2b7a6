import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import { AppError } from "../utils/AppError";

const handlePrismaKnownRequestError = (
	err: Prisma.PrismaClientKnownRequestError,
) => {
	const { code, meta } = err;

	switch (code) {
		case "P2000":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message:
					"The provided value for the column is too long for the column's type.",
			};
		case "P2001":
			return {
				statusCode: httpStatus.NOT_FOUND,
				message:
					"The record searched for in the where condition does not exist.",
			};
		case "P2002":
			return {
				statusCode: httpStatus.CONFLICT,
				message: `Duplicate entry: A record with this ${
					meta?.target || "field"
				} already exists.`,
			};
		case "P2003":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: `Foreign key constraint failed on the field: ${
					meta?.field_name || "unknown field"
				}.`,
			};
		case "P2004":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "A constraint failed on the database.",
			};
		case "P2005":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: `The value ${
					meta?.field_value || "provided"
				} for field ${meta?.field_name || "unknown"} is invalid.`,
			};
		case "P2006":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: `The provided value for ${
					meta?.field_name || "field"
				} is not valid.`,
			};
		case "P2007":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Data validation error in the database.",
			};
		case "P2008":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Failed to parse the query.",
			};
		case "P2009":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Failed to validate the query.",
			};
		case "P2010":
			return {
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				message: "Raw query failed.",
			};
		case "P2011":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Null constraint violation on the field.",
			};
		case "P2012":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Missing a required value.",
			};
		case "P2013":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Missing a required argument.",
			};
		case "P2014":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message:
					"The change you are trying to make would violate the required relation.",
			};
		case "P2015":
			return {
				statusCode: httpStatus.NOT_FOUND,
				message: "A related record could not be found.",
			};
		case "P2016":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Query interpretation error.",
			};
		case "P2017":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "The records for relation are not connected.",
			};
		case "P2018":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "The required connected records were not found.",
			};
		case "P2019":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Input error in the query.",
			};
		case "P2020":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Value out of range for the column type.",
			};
		case "P2021":
			return {
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				message: "The table does not exist in the current database.",
			};
		case "P2022":
			return {
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				message: "The column does not exist in the current database.",
			};
		case "P2023":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Inconsistent column data.",
			};
		case "P2024":
			return {
				statusCode: httpStatus.REQUEST_TIMEOUT,
				message: "Database operation timed out. Please try again.",
			};
		case "P2025":
			return {
				statusCode: httpStatus.NOT_FOUND,
				message:
					"Record not found. The operation failed because required records were not found.",
			};
		case "P2026":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "The current database provider doesn't support this feature.",
			};
		case "P2027":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Multiple database errors occurred.",
			};
		case "P2028":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Transaction API error.",
			};
		case "P2029":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Query parameter limit exceeded.",
			};
		case "P2030":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Cannot find a full text index to use for the search.",
			};
		case "P2031":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message:
					"MongoDB: Prisma needs to perform transactions but the feature is not available.",
			};
		case "P2033":
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: "Number out of range for the database provider.",
			};
		case "P2034":
			return {
				statusCode: httpStatus.CONFLICT,
				message:
					"Transaction failed due to a write conflict or deadlock. Please retry.",
			};
		default:
			return {
				statusCode: httpStatus.BAD_REQUEST,
				message: `Database error: ${code}`,
			};
	}
};

const handlePrismaInitializationError = (
	err: Prisma.PrismaClientInitializationError,
) => {
	const name = "Database Connection Error";

	switch (err.errorCode) {
		case "P1000":
			return {
				statusCode: httpStatus.UNAUTHORIZED,
				name,
				message:
					"Authentication failed against database server. Please check your credentials.",
			};
		case "P1001":
			return {
				statusCode: httpStatus.SERVICE_UNAVAILABLE,
				name,
				message:
					"Can't reach database server. Please check your connection string.",
			};
		case "P1002":
			return {
				statusCode: httpStatus.REQUEST_TIMEOUT,
				name,
				message: "Database connection timed out. Please try again.",
			};
		case "P1003":
			return {
				statusCode: httpStatus.SERVICE_UNAVAILABLE,
				name,
				message: "Database server is not available.",
			};
		case "P1008":
			return {
				statusCode: httpStatus.REQUEST_TIMEOUT,
				name,
				message: "Operations timed out. Please try again later.",
			};
		case "P1009":
			return {
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				name,
				message: "Database already exists with different case name.",
			};
		default:
			return {
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				name,
				message: `Database connection error: ${err.message}`,
			};
	}
};

export const globalErrorHandler = async (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	// if (config.node_env === "development") {
	console.log("Error from Global Error Handler", err);
	// }

	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorMessage = err.message || "Internal Server Error";
	let errorName = err.name || "Internal Server Error";

	// Handle Prisma Validation Errors
	if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorMessage = "Invalid data provided. Please check your input fields.";
		errorName = "Validation Error";
	}
	// Handle Prisma Known Request Errors
	else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		const handled = handlePrismaKnownRequestError(err);
		statusCode = handled.statusCode;
		errorMessage = handled.message;
		errorName = "Database Error";
	}
	// Handle Prisma Initialization Errors
	else if (err instanceof Prisma.PrismaClientInitializationError) {
		const handled = handlePrismaInitializationError(err);
		statusCode = handled.statusCode;
		errorMessage = handled.message;
		errorName = handled.name;
	}
	// Handle Prisma Unknown Request Errors
	else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		errorMessage =
			"An unknown database error occurred during query execution. Please try again.";
		errorName = "Unknown Database Error";
	}
	// Handle Prisma Rust Panic Errors
	else if (err instanceof Prisma.PrismaClientRustPanicError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		errorMessage =
			"A critical database engine error occurred. Please contact support.";
		errorName = "Database Engine Error";
	}
	// Handle Custom AppError
	else if (err instanceof AppError) {
		errorMessage = err.message;
		statusCode = err.statusCode;
		errorName = "Application Error";
	}
	// Handle Generic Errors
	else if (err instanceof Error) {
		errorMessage = err.message;
	}

	// Send error response
	res.status(statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
		success: false,
		message: errorMessage,
		errorDetails: {
			name: errorName,
			statusCode: statusCode || httpStatus.INTERNAL_SERVER_ERROR,
			stack: config.node_env === "development" ? err.stack : undefined,
			prismaErrorCode:
				err instanceof Prisma.PrismaClientKnownRequestError
					? err.code
					: undefined,
		},
	});
};
