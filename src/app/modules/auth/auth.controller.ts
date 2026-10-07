import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const getAuthCookieOptions = (req: Request) => {
	const requestOrigin = req.headers.origin ?? "";
	const isLocalDevelopment =
		requestOrigin.startsWith("http://localhost") ||
		requestOrigin.startsWith("http://127.0.0.1");

	return {
		httpOnly: true,
		secure: !isLocalDevelopment,
		sameSite: isLocalDevelopment ? ("lax" as const) : ("none" as const),
	};
};

const setAuthCookies = (
	req: Request,
	res: Response,
	accessToken: string,
	refreshToken: string,
) => {
	const cookieOptions = getAuthCookieOptions(req);

	res.cookie("accessToken", accessToken, {
		...cookieOptions,
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		...cookieOptions,
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});
};

const registerCustomer = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.registerCustomer(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message:
			"Verification OTP sent to your email. Please verify your email to complete the registration process.",
		data: result,
	});
});

const resendRegistrationOtp = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		const result = await AuthService.resendRegistrationOtp(payload);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "A new verification OTP has been sent to your email.",
			data: result,
		});
	},
);

const verifyCustomerEmail = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.verifyCustomerEmail(payload);

	const { accessToken, refreshToken } = result;

	setAuthCookies(req, res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "User registered and email verified successfully",
		data: {
			accessToken,
			refreshToken,
		},
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await AuthService.loginUser(payload);
	const { accessToken, refreshToken } = result;

	setAuthCookies(req, res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged in successfully",
		data: {
			accessToken,
			refreshToken,
		},
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as unknown as IRequestUser;

	if (!user) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"User information is missing in the request",
		);
	}

	const result = await AuthService.getMe(user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
	}
	const result = await AuthService.refreshToken(req.cookies.refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	setAuthCookies(req, res, accessToken, newRefreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.googleLogin(payload);

	const { accessToken, refreshToken } = result;

	setAuthCookies(req, res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken,
		},
	});
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await AuthService.forgotPassword(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Otp sent to your email ${payload.email}`,
		data: result,
	});
});

const resendForgotPasswordOtp = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body;

		const result = await AuthService.resendForgotPasswordOtp(payload);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: `A new OTP has been sent to your email ${payload.email}`,
			data: result,
		});
	},
);

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await AuthService.resetPassword(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Password has been reset successfully",
		data: null,
	});
});

const logout = catchAsync(async (req: Request, res: Response) => {
	const cookieOptions = getAuthCookieOptions(req);

	res.clearCookie("accessToken", cookieOptions);
	res.clearCookie("refreshToken", cookieOptions);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged out successfully",
		data: null,
	});
});

export const AuthController = {
	registerCustomer,
	verifyCustomerEmail,
	resendRegistrationOtp,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	resendForgotPasswordOtp,
	logout,
};
