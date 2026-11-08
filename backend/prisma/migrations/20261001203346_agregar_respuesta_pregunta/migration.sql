-- CreateTable
CREATE TABLE "RespuestaPregunta" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "idPregunta" INTEGER NOT NULL,
    "opcionElegida" TEXT NOT NULL,
    "correcta" BOOLEAN NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaPregunta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RespuestaPregunta_idUsuario_idPregunta_key" ON "RespuestaPregunta"("idUsuario", "idPregunta");

-- AddForeignKey
ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaPregunta" ADD CONSTRAINT "RespuestaPregunta_idPregunta_fkey" FOREIGN KEY ("idPregunta") REFERENCES "Pregunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
