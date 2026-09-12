import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import {
	authLimiter,
	loginLimiter,
	otpLimiter,
} from "../../middlewares/rateLimit";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { userAuthValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	authLimiter,
	validateRequest(userAuthValidation.RegistrationZodSchema),
	AuthController.registerCustomer,
);

router.post(
	"/verify-email",
	otpLimiter,
	validateRequest(userAuthValidation.EmailVerificationZodSchema),
	AuthController.verifyCustomerEmail,
);

router.post(
	"/login",
	loginLimiter,
	validateRequest(userAuthValidation.UserLoginZodSchema),
	AuthController.loginUser,
);

router.get("/me", auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN), AuthController.getMe);

router.post("/refresh-token", authLimiter, AuthController.refreshToken);

router.post("/google", authLimiter, AuthController.googleLogin);

router.post(
	"/forgot-password",
	authLimiter,
	validateRequest(userAuthValidation.ForgotPassword),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	otpLimiter,
	validateRequest(userAuthValidation.ResetPassword),
	AuthController.resetPassword,
);

router.post("/logout", AuthController.logout);

export const AuthRoutes = router;
