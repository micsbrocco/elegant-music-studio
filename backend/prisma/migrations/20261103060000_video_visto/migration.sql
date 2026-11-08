-- Seguimiento de cuánto se vio de cada clase de video
ALTER TABLE "Progreso" ADD COLUMN "tramosVistos" TEXT;
ALTER TABLE "Progreso" ADD COLUMN "duracionVideo" DOUBLE PRECISION;
ALTER TABLE "Progreso" ADD COLUMN "ultimoAvisoVideo" TIMESTAMP(3);
