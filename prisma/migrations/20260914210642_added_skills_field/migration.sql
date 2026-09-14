-- AlterTable
ALTER TABLE "technician_applications" ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "technicians" ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
