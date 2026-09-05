import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middlewares/checkAuth";
import {
	validateRequest,
	validateRequestParams,
} from "../../middlewares/validateRequest";
import { TechnicianApplicationController } from "./technicianApplication.controller";
import { technicianApplicationValidation } from "./technicianApplication.validation";

const router = Router();

router.post(
	"/apply",
	upload.fields([
		{ name: "resume", maxCount: 1 },
		{ name: "additionalDocuments", maxCount: 5 },
	]),
	validateRequest(
		technicianApplicationValidation.ApplyTechnicianApplicationZodSchema,
	),
	TechnicianApplicationController.applyAsTechnician,
);

router.get("/status", TechnicianApplicationController.getApplicationStatus);

router.get(
	"/",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	TechnicianApplicationController.getAllApplications,
);

router.get(
	"/:id",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequestParams(
		technicianApplicationValidation.ApplicationIdParamsZodSchema,
	),
	TechnicianApplicationController.getApplicationById,
);

router.post(
	"/:id/approve",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequestParams(
		technicianApplicationValidation.ApplicationIdParamsZodSchema,
	),
	TechnicianApplicationController.approveApplication,
);

router.post(
	"/:id/reject",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequestParams(
		technicianApplicationValidation.ApplicationIdParamsZodSchema,
	),
	validateRequest(technicianApplicationValidation.RejectApplicationZodSchema),
	TechnicianApplicationController.rejectApplication,
);

export const TechnicianApplicationRoutes = router;
