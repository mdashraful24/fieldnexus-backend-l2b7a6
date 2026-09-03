-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORK_ORDER_ASSIGNED', 'WORK_ORDER_ACCEPTED', 'WORK_ORDER_COMPLETED', 'PAYMENT_SUCCESS', 'GENERAL');

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_workOrderId_key" ON "feedbacks"("workOrderId");

-- CreateIndex
CREATE INDEX "idx_feedback_workOrderId" ON "feedbacks"("workOrderId");

-- CreateIndex
CREATE INDEX "idx_feedback_customerId" ON "feedbacks"("customerId");

-- CreateIndex
CREATE INDEX "idx_notification_userId" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "idx_notification_isRead" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "idx_notification_createdAt" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
