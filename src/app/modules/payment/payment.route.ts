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

router.post(
	"/:paymentId/cancel",
	auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
	PaymentController.cancelPayment,
);

router.post(
	"/:paymentId/refund",
	auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(paymentValidation.RefundPaymentZodSchema),
	PaymentController.refundPayment,
);

router.get(
	"/",
	auth(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	PaymentController.getAllPayments,
);

router.get(
	"/:paymentId",
	auth(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	PaymentController.getPaymentById,
);

export const PaymentRoutes = router;
