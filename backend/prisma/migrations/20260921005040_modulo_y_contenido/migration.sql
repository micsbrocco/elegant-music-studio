/*
  Warnings:

  - You are about to drop the column `archivoDescargable` on the `Modulo` table. All the data in the column will be lost.
  - You are about to drop the column `contenidoTexto` on the `Modulo` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Modulo` table. All the data in the column will be lost.
  - You are about to drop the column `urlVideo` on the `Modulo` table. All the data in the column will be lost.
  - You are about to drop the column `idModulo` on the `Pregunta` table. All the data in the column will be lost.
  - You are about to drop the column `idModulo` on the `Progreso` table. All the data in the column will be lost.
  - Added the required column `idContenido` to the `Pregunta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idContenido` to the `Progreso` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pregunta" DROP CONSTRAINT "Pregunta_idModulo_fkey";

-- DropForeignKey
ALTER TABLE "Progreso" DROP CONSTRAINT "Progreso_idModulo_fkey";

-- AlterTable
ALTER TABLE "Modulo" DROP COLUMN "archivoDescargable",
DROP COLUMN "contenidoTexto",
DROP COLUMN "tipo",
DROP COLUMN "urlVideo";

-- AlterTable
ALTER TABLE "Pregunta" DROP COLUMN "idModulo",
ADD COLUMN     "idContenido" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Progreso" DROP COLUMN "idModulo",
ADD COLUMN     "idContenido" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Contenido" (
    "id" SERIAL NOT NULL,
    "idModulo" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenidoTexto" TEXT,
    "urlVideo" TEXT,
    "archivoDescargable" TEXT,

    CONSTRAINT "Contenido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contenido" ADD CONSTRAINT "Contenido_idModulo_fkey" FOREIGN KEY ("idModulo") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progreso" ADD CONSTRAINT "Progreso_idContenido_fkey" FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_idContenido_fkey" FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
