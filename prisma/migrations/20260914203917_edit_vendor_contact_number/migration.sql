/*
  Warnings:

  - You are about to drop the column `phone` on the `vendors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "phone",
ADD COLUMN     "contactNumber" TEXT;
