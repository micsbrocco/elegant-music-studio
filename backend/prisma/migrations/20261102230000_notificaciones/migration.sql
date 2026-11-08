-- Avisos de la campana del panel
CREATE TABLE "Notificacion" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT,
    "enlace" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notificacion_idUsuario_leida_creadaEn_idx" ON "Notificacion"("idUsuario", "leida", "creadaEn");

ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_idUsuario_fkey"
    FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
