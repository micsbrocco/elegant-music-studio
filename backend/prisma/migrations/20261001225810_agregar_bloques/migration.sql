-- DropForeignKey
ALTER TABLE "Pregunta" DROP CONSTRAINT "Pregunta_idContenido_fkey";

-- AlterTable
ALTER TABLE "Pregunta" ADD COLUMN     "idBloque" INTEGER,
ALTER COLUMN "idContenido" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Bloque" (
    "id" SERIAL NOT NULL,
    "idContenido" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "contenidoTexto" TEXT,

    CONSTRAINT "Bloque_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bloque" ADD CONSTRAINT "Bloque_idContenido_fkey" FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_idContenido_fkey" FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_idBloque_fkey" FOREIGN KEY ("idBloque") REFERENCES "Bloque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
