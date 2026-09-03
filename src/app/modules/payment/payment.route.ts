import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";

const router = Router();

router.post(
	"/initiate",
	auth(Role.CUSTOMER),
	validateRequest(paymentValidation.InitiatePaymentZodSchema),
	PaymentController.initiatePayment,
);

router.get("/callback", PaymentController.paymentCallback);

router.get(
	"/",
	auth(Role.ADMIN, Role.CUSTOMER),
	PaymentController.getAllPayments,
);

router.get(
	"/:paymentId",
	auth(Role.ADMIN, Role.CUSTOMER),
	PaymentController.getPaymentById,
);

export const PaymentRoutes = router;
