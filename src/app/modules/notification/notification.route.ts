import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get(
	"/",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	NotificationController.getMyNotifications,
);

router.patch(
	"/read-all",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	NotificationController.markAllAsRead,
);

router.patch(
	"/:id/read",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	NotificationController.markAsRead,
);

export const NotificationRoutes = router;
