-- Pedidos del "Botón de arrepentimiento"
CREATE TABLE "SolicitudArrepentimiento" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referencia" TEXT,
    "motivo" TEXT,
    "idUsuario" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" TIMESTAMP(3),

    CONSTRAINT "SolicitudArrepentimiento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SolicitudArrepentimiento_codigo_key" ON "SolicitudArrepentimiento"("codigo");
CREATE INDEX "SolicitudArrepentimiento_estado_creadaEn_idx" ON "SolicitudArrepentimiento"("estado", "creadaEn");

ALTER TABLE "SolicitudArrepentimiento" ADD CONSTRAINT "SolicitudArrepentimiento_idUsuario_fkey"
    FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
