import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { AdminRoutes } from "./app/modules/admin/admin.route";
import { AuthRoutes } from "./app/modules/auth/auth.route";
import { NotificationRoutes } from "./app/modules/notification/notification.route";
import { PaymentRoutes } from "./app/modules/payment/payment.route";
import { UserRoutes } from "./app/modules/user/user.route";
import { VendorRoutes } from "./app/modules/vendor/vendor.route";
import { ServiceCategoryRoutes } from "./app/modules/serviceCategory/serviceCategory.route";
import { SuperAdminRoutes } from "./app/modules/superAdmin/superAdmin.route";
import { TechnicianApplicationRoutes } from "./app/modules/technicianApplication/technicianApplication.route";
import { WorkOrderRoutes } from "./app/modules/workOrder/workOrder.route";
import { sendResponse } from "./app/utils/sendResponse";

const API_PREFIX = `/api/${config.field_nexus_api_version}`;

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use(`${API_PREFIX}/auth`, AuthRoutes);
app.use(`${API_PREFIX}/user`, UserRoutes);
app.use(`${API_PREFIX}/vendors`, VendorRoutes);
app.use(`${API_PREFIX}/service-categories`, ServiceCategoryRoutes);
app.use(`${API_PREFIX}/work-orders`, WorkOrderRoutes);
app.use(`${API_PREFIX}/payments`, PaymentRoutes);
app.use(`${API_PREFIX}/notifications`, NotificationRoutes);
app.use(`${API_PREFIX}/admin`, AdminRoutes);
app.use(`${API_PREFIX}/super-admin`, SuperAdminRoutes);
app.use(`${API_PREFIX}/technician-applications`, TechnicianApplicationRoutes);

// Default route
app.get("/", (req: Request, res: Response) => {
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Welcome to the Field Nexus API. The server is running successfully.",
		data: {
			status: "Healthy",
			author: config.project_author,
		},
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
