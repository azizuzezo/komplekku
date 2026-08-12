-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
