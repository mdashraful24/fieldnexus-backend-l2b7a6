import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { ServiceCategoryController } from "./serviceCategory.controller";
import { serviceCategoryValidation } from "./serviceCategory.validation";

const router = Router();

router.post(
	"/",
	auth(Role.ADMIN),
	validateRequest(serviceCategoryValidation.CreateServiceCategoryZodSchema),
	ServiceCategoryController.createServiceCategory,
);

router.get("/", ServiceCategoryController.getAllServiceCategories);

router.get("/:id", ServiceCategoryController.getServiceCategoryById);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(serviceCategoryValidation.UpdateServiceCategoryZodSchema),
	ServiceCategoryController.updateServiceCategory,
);

router.delete("/:id", auth(Role.ADMIN), ServiceCategoryController.deleteServiceCategory);

export const ServiceCategoryRoutes = router;
