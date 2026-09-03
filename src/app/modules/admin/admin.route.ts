import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

router.get(
	"/dashboard-stats",
	auth(Role.ADMIN),
	AdminController.getDashboardStats,
);

router.get("/users", auth(Role.ADMIN), AdminController.getAllUsers);

router.patch(
	"/users/:id/status",
	auth(Role.ADMIN),
	validateRequest(adminValidation.UpdateUserStatusZodSchema),
	AdminController.updateUserStatus,
);

router.get("/audit-logs", auth(Role.ADMIN), AdminController.getAuditLogs);

router.get(
	"/vendors/:id/performance",
	auth(Role.ADMIN),
	AdminController.getVendorPerformance,
);

export const AdminRoutes = router;
