import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { userValidation } from "./user.validation";

const router = Router();

router.patch(
    "/upload-profile-picture",
    auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
    upload.single("profilePicture"),
    UserController.uploadProfilePicture,
);

router.patch(
    "/update-user-info",
    auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
    validateRequest(userValidation.UpdateUserProfileZodSchema),
    UserController.updateUserInfo,
);

export const UserRoutes = router;
