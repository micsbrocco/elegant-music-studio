-- Sesiones con token de renovación (cookie httpOnly)
CREATE TABLE "SesionUsuario" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenAnteriorHash" TEXT,
    "rotadaEn" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "revocadaEn" TIMESTAMP(3),
    "agente" TEXT,

    CONSTRAINT "SesionUsuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SesionUsuario_tokenHash_key" ON "SesionUsuario"("tokenHash");
CREATE INDEX "SesionUsuario_idUsuario_idx" ON "SesionUsuario"("idUsuario");
CREATE INDEX "SesionUsuario_tokenAnteriorHash_idx" ON "SesionUsuario"("tokenAnteriorHash");

ALTER TABLE "SesionUsuario" ADD CONSTRAINT "SesionUsuario_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
