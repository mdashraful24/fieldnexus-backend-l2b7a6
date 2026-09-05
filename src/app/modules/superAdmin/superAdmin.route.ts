import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { SuperAdminController } from "./superAdmin.controller";
import { superAdminValidation } from "./superAdmin.validation";

const router = Router();

router.get(
	"/admins",
	auth(Role.SUPER_ADMIN),
	SuperAdminController.getAllAdmins,
);

router.post(
	"/admins",
	auth(Role.SUPER_ADMIN),
	validateRequest(superAdminValidation.CreateAdminZodSchema),
	SuperAdminController.createAdmin,
);

router.get(
	"/admins/:id",
	auth(Role.SUPER_ADMIN),
	SuperAdminController.getAdminById,
);

router.patch(
	"/admins/:id/status",
	auth(Role.SUPER_ADMIN),
	validateRequest(superAdminValidation.UpdateAdminStatusZodSchema),
	SuperAdminController.updateAdminStatus,
);

router.patch(
	"/admins/:id/restore",
	auth(Role.SUPER_ADMIN),
	SuperAdminController.restoreAdmin,
);

router.patch(
	"/admins/:id",
	auth(Role.SUPER_ADMIN),
	validateRequest(superAdminValidation.UpdateAdminProfileZodSchema),
	SuperAdminController.updateAdminProfile,
);

export const SuperAdminRoutes = router;
