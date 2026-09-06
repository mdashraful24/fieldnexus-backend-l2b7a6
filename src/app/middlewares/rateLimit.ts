import { rateLimit } from "express-rate-limit";
import httpStatus from "http-status";

export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		statusCode: httpStatus.TOO_MANY_REQUESTS,
		success: false,
		message:
			"Too many requests from this IP, please try again after 15 minutes.",
	},
});

export const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		statusCode: httpStatus.TOO_MANY_REQUESTS,
		success: false,
		message: "Too many login attempts from this IP, please try again later.",
	},
});

export const otpLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		statusCode: httpStatus.TOO_MANY_REQUESTS,
		success: false,
		message:
			"Too many OTP verification attempts from this IP, please try again later.",
	},
});

export const appLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 500,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		statusCode: httpStatus.TOO_MANY_REQUESTS,
		success: false,
		message: "Too many requests from this IP, please try again later.",
	},
});
