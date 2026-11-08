-- DropForeignKey
ALTER TABLE "Progreso" DROP CONSTRAINT "Progreso_idContenido_fkey";

-- AddForeignKey
ALTER TABLE "Progreso" ADD CONSTRAINT "Progreso_idContenido_fkey" FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
