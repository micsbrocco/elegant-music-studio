/*
  Warnings:

  - A unique constraint covering the columns `[idInscripcion,idContenido]` on the table `Progreso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Progreso_idInscripcion_idContenido_key" ON "Progreso"("idInscripcion", "idContenido");
