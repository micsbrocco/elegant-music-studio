-- AlterTable
ALTER TABLE "Curso" ADD COLUMN     "idInstructor" INTEGER;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_idInstructor_fkey" FOREIGN KEY ("idInstructor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
