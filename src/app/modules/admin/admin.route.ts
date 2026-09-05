import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

router.get(
	"/dashboard-stats",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	AdminController.getDashboardStats,
);

router.get(
	"/users",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	AdminController.getAllUsers,
);

router.patch(
	"/users/:id/status",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	validateRequest(adminValidation.UpdateUserStatusZodSchema),
	AdminController.updateUserStatus,
);

router.patch(
	"/users/:id/restore",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	AdminController.restoreUser,
);

router.get(
	"/audit-logs",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	AdminController.getAuditLogs,
);

router.get(
	"/vendors/:id/performance",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	AdminController.getVendorPerformance,
);

export const AdminRoutes = router;
