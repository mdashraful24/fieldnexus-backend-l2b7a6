import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { WorkOrderController } from "./workOrder.controller";
import { workOrderValidation } from "./workOrder.validation";

const router = Router();

router.post(
	"/",
	auth(Role.CUSTOMER),
	validateRequest(workOrderValidation.CreateWorkOrderZodSchema),
	WorkOrderController.createWorkOrder,
);

router.get("/", auth(Role.ADMIN), WorkOrderController.getAllWorkOrders);

router.get(
	"/my-assigned",
	auth(Role.TECHNICIAN),
	WorkOrderController.getMyAssignedWorkOrders,
);

router.patch(
	"/:id/status",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	validateRequest(workOrderValidation.UpdateWorkOrderStatusZodSchema),
	WorkOrderController.updateWorkOrderStatus,
);

router.get(
	"/:id",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	WorkOrderController.getWorkOrderById,
);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(workOrderValidation.UpdateWorkOrderZodSchema),
	WorkOrderController.updateWorkOrder,
);

router.delete("/:id", auth(Role.ADMIN), WorkOrderController.deleteWorkOrder);

export const WorkOrderRoutes = router;
