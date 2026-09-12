import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get(
	"/",
	auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN),
	NotificationController.getMyNotifications,
);

router.patch(
	"/read-all",
	auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN),
	NotificationController.markAllAsRead,
);

router.patch(
	"/:id/read",
	auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN),
	NotificationController.markAsRead,
);

export const NotificationRoutes = router;
