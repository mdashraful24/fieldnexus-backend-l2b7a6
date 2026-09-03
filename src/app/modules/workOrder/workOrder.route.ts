import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AssignmentController } from "../assignment/assignment.controller";
import { assignmentValidation } from "../assignment/assignment.validation";
import { FeedbackController } from "../feedback/feedback.controller";
import { feedbackValidation } from "../feedback/feedback.validation";
import { ServiceReportController } from "../serviceReport/serviceReport.controller";
import { serviceReportValidation } from "../serviceReport/serviceReport.validation";
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

router.post(
	"/:id/assign",
	auth(Role.ADMIN),
	validateRequest(assignmentValidation.AssignWorkOrderZodSchema),
	AssignmentController.assignWorkOrder,
);

router.post(
	"/:id/accept",
	auth(Role.TECHNICIAN),
	AssignmentController.acceptWorkOrder,
);

router.post(
	"/:id/reject",
	auth(Role.TECHNICIAN),
	validateRequest(assignmentValidation.RejectAssignmentZodSchema),
	AssignmentController.rejectWorkOrder,
);

router.post(
	"/:id/service-report",
	auth(Role.TECHNICIAN),
	validateRequest(serviceReportValidation.CreateServiceReportZodSchema),
	ServiceReportController.createServiceReport,
);

router.get(
	"/:id/service-report",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	ServiceReportController.getServiceReport,
);

router.post(
	"/:id/feedback",
	auth(Role.CUSTOMER),
	validateRequest(feedbackValidation.CreateFeedbackZodSchema),
	FeedbackController.createFeedback,
);

router.get(
	"/:id/feedback",
	auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
	FeedbackController.getFeedback,
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
