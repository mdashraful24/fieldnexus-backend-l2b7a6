import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { VendorController } from "./vendor.controller";
import { vendorValidation } from "./vendor.validation";

const router = Router();

router.post(
	"/",
	auth(Role.ADMIN),
	validateRequest(vendorValidation.CreateVendorZodSchema),
	VendorController.createVendor,
);

router.get("/", VendorController.getAllVendors);

router.get("/:id", VendorController.getVendorById);

router.patch(
	"/:id",
	auth(Role.ADMIN),
	validateRequest(vendorValidation.UpdateVendorZodSchema),
	VendorController.updateVendor,
);

router.delete("/:id", auth(Role.ADMIN), VendorController.deleteVendor);

export const VendorRoutes = router;
