-- CreateTable
CREATE TABLE "service_reports" (
    "id" TEXT NOT NULL,
    "workDescription" TEXT NOT NULL,
    "issueFound" TEXT,
    "solutionProvided" TEXT,
    "partsUsed" JSONB,
    "hoursWorked" DOUBLE PRECISION NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,

    CONSTRAINT "service_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_reports_workOrderId_key" ON "service_reports"("workOrderId");

-- CreateIndex
CREATE INDEX "idx_service_report_workOrderId" ON "service_reports"("workOrderId");

-- CreateIndex
CREATE INDEX "idx_service_report_technicianId" ON "service_reports"("technicianId");

-- AddForeignKey
ALTER TABLE "service_reports" ADD CONSTRAINT "service_reports_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reports" ADD CONSTRAINT "service_reports_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
