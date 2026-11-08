/*
  Warnings:

  - You are about to drop the column `etiquetaInstructor` on the `Curso` table. All the data in the column will be lost.
  - You are about to drop the column `idInstructor` on the `Curso` table. All the data in the column will be lost.
  - You are about to drop the `_CursoEditores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Curso" DROP CONSTRAINT "Curso_idInstructor_fkey";

-- DropForeignKey
ALTER TABLE "_CursoEditores" DROP CONSTRAINT "_CursoEditores_A_fkey";

-- DropForeignKey
ALTER TABLE "_CursoEditores" DROP CONSTRAINT "_CursoEditores_B_fkey";

-- AlterTable
ALTER TABLE "Curso" DROP COLUMN "etiquetaInstructor",
DROP COLUMN "idInstructor";

-- DropTable
DROP TABLE "_CursoEditores";

-- CreateTable
CREATE TABLE "CursoColaborador" (
    "id" SERIAL NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "etiqueta" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CursoColaborador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CursoColaborador_idCurso_idUsuario_key" ON "CursoColaborador"("idCurso", "idUsuario");

-- AddForeignKey
ALTER TABLE "CursoColaborador" ADD CONSTRAINT "CursoColaborador_idCurso_fkey" FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CursoColaborador" ADD CONSTRAINT "CursoColaborador_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
