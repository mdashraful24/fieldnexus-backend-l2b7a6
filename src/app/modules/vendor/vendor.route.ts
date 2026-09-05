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

router.patch(
	"/:id/restore",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	VendorController.restoreVendor,
);

router.post(
	"/:vendorId/members",
	auth(Role.ADMIN),
	validateRequest(vendorValidation.AddVendorMemberZodSchema),
	VendorController.addMember,
);

router.get("/:vendorId/members", auth(Role.ADMIN), VendorController.getMembers);

router.delete(
	"/:vendorId/members/:technicianId",
	auth(Role.ADMIN),
	VendorController.removeMember,
);

router.patch(
	"/:vendorId/members/:technicianId/restore",
	auth(Role.ADMIN, Role.SUPER_ADMIN),
	VendorController.restoreMember,
);

export const VendorRoutes = router;
