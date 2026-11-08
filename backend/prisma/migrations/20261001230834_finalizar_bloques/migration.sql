/*
  Warnings:

  - You are about to drop the column `idContenido` on the `Pregunta` table. All the data in the column will be lost.
  - Made the column `idBloque` on table `Pregunta` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Pregunta" DROP CONSTRAINT "Pregunta_idContenido_fkey";

-- AlterTable
ALTER TABLE "Pregunta" DROP COLUMN "idContenido",
ALTER COLUMN "idBloque" SET NOT NULL;
