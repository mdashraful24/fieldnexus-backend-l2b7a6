import type { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IUpdateUserProfilePayload } from "./user.interface";

const uploadProfilePicture = async (buffer: Buffer, userId: string) => {
    const currentUser = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            imagePublicId: true,
            imageUrl: true,
        },
    });

    const cloudinaryResult = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
            cloudinary.uploader
                .upload_stream({ resource_type: "auto" }, async (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!result) {
                        return reject(
                            new AppError(
                                httpStatus.BAD_REQUEST,
                                "No result returned from Cloudinary",
                            ),
                        );
                    }

                    resolve(result);
                })
                .end(buffer);
        },
    );

    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            imageUrl: cloudinaryResult.secure_url,
            imagePublicId: cloudinaryResult.public_id,
        },
        omit: {
            password: true,
        },
    });

    if (currentUser?.imagePublicId && currentUser?.imageUrl) {
        await cloudinary.uploader.destroy(currentUser.imagePublicId);
    }

    return updatedUser;
};

const updateUserInfo = async (userId: string, payload: IUpdateUserProfilePayload) => {
    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: payload,
        omit: {
            password: true,
        },
    });

    return updatedUser;
};

export const UserServices = {
    uploadProfilePicture,
    updateUserInfo,
};
