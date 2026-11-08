-- CreateTable
CREATE TABLE "ArchivoContenido" (
    "id" SERIAL NOT NULL,
    "idContenido" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoContenido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArchivoContenido" ADD CONSTRAINT "ArchivoContenido_idContenido_fkey" FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
