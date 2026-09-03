-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "basePrice" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "gateway" TEXT NOT NULL DEFAULT 'bKash',
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "merchantInvoiceNumber" TEXT,
    "bkashPaymentId" TEXT,
    "bkashTrxId" TEXT,
    "payUrl" TEXT,
    "payerReference" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_workOrderId_key" ON "payments"("workOrderId");

-- CreateIndex
CREATE INDEX "idx_payment_workOrderId" ON "payments"("workOrderId");

-- CreateIndex
CREATE INDEX "idx_payment_customerId" ON "payments"("customerId");

-- CreateIndex
CREATE INDEX "idx_payment_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payment_createdAt" ON "payments"("createdAt");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
