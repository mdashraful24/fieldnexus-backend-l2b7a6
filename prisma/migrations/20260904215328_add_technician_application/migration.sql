-- CreateEnum
CREATE TYPE "TechnicianApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_REJECTED';

-- CreateTable
CREATE TABLE "technician_applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "qualifications" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "bio" TEXT,
    "resume" TEXT,
    "resumePublicId" TEXT,
    "additionalDocuments" JSONB,
    "status" "TechnicianApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "technicianId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "technician_applications_email_key" ON "technician_applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "technician_applications_technicianId_key" ON "technician_applications"("technicianId");

-- CreateIndex
CREATE INDEX "idx_technician_application_email" ON "technician_applications"("email");

-- CreateIndex
CREATE INDEX "idx_technician_application_status" ON "technician_applications"("status");

-- AddForeignKey
ALTER TABLE "technician_applications" ADD CONSTRAINT "technician_applications_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
