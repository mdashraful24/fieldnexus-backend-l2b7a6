-- AlterTable
ALTER TABLE "payments" ADD COLUMN "refundTrxId" TEXT,
ADD COLUMN "refundAmount" DECIMAL(10,2),
ADD COLUMN "refundReason" TEXT,
ADD COLUMN "refundAt" TIMESTAMP(3);
