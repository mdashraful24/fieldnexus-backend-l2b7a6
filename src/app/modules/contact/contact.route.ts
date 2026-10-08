import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { ContactController } from "./contact.controller";
import { contactValidation } from "./contact.validation";

const router = Router();

router.post(
	"/",
	validateRequest(contactValidation.CreateContactMessageZodSchema),
	ContactController.createContactMessage,
);

router.get(
	"/",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	ContactController.getAllContactMessages,
);

router.patch(
	"/:id/read",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(contactValidation.UpdateContactMessageZodSchema),
	ContactController.updateContactMessageReadStatus,
);

export const ContactRoutes = router;
