/*
  Warnings:

  - You are about to drop the column `phone` on the `technician_applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "technician_applications" DROP COLUMN "phone",
ADD COLUMN     "contactNumber" TEXT;
