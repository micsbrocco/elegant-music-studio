-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "estadisticas" JSONB,
ADD COLUMN     "incluye" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nivel" TEXT,
ADD COLUMN     "precioOriginal" DECIMAL(65,30);
