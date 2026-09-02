import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { userAuthValidation } from "./auth.validation";

const router = Router();

router.post(
	"/register",
	validateRequest(userAuthValidation.RegistrationZodSchema),
	AuthController.registerCustomer,
);

router.post(
	"/verify-email",
	validateRequest(userAuthValidation.EmailVerificationZodSchema),
	AuthController.verifyCustomerEmail,
);

router.post(
	"/login",
	validateRequest(userAuthValidation.UserLoginZodSchema),
	AuthController.loginUser,
);

router.get(
	"/me",
	auth(Role.ADMIN, Role.TECHNICIAN, Role.CUSTOMER),
	AuthController.getMe,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/google", AuthController.googleLogin);

router.post(
	"/forgot-password",
	validateRequest(userAuthValidation.ForgotPassword),
	AuthController.forgotPassword,
);

router.post(
	"/reset-password",
	validateRequest(userAuthValidation.ResetPassword),
	AuthController.resetPassword,
);

export const AuthRoutes = router;
