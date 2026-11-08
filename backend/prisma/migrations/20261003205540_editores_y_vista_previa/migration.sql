-- AlterTable
ALTER TABLE "Inscripcion" ADD COLUMN     "esVistaPrevia" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_CursoEditores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CursoEditores_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CursoEditores_B_index" ON "_CursoEditores"("B");

-- AddForeignKey
ALTER TABLE "_CursoEditores" ADD CONSTRAINT "_CursoEditores_A_fkey" FOREIGN KEY ("A") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CursoEditores" ADD CONSTRAINT "_CursoEditores_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
