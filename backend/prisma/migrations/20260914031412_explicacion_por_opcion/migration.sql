/*
  Warnings:

  - You are about to drop the column `explicacion` on the `Pregunta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pregunta" DROP COLUMN "explicacion",
ADD COLUMN     "explicacionA" TEXT,
ADD COLUMN     "explicacionB" TEXT,
ADD COLUMN     "explicacionC" TEXT,
ADD COLUMN     "explicacionD" TEXT;
