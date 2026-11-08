-- Operaciones de Mercado Pago: monto cobrado, comisión, neto, medio de pago y estado
CREATE TABLE "OperacionPago" (
    "id" SERIAL NOT NULL,
    "idExterno" TEXT NOT NULL,
    "idUsuario" INTEGER,
    "estado" TEXT NOT NULL,
    "montoTotal" DECIMAL(65,30) NOT NULL,
    "comision" DECIMAL(65,30),
    "neto" DECIMAL(65,30),
    "montoReembolsado" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "medioPago" TEXT,
    "tipoMedio" TEXT,
    "cuotas" INTEGER,
    "fechaAprobacion" TIMESTAMP(3) NOT NULL,
    "fechaAcreditacion" TIMESTAMP(3),
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperacionPago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperacionPago_idExterno_key" ON "OperacionPago"("idExterno");
CREATE INDEX "OperacionPago_fechaAprobacion_idx" ON "OperacionPago"("fechaAprobacion");

ALTER TABLE "OperacionPago" ADD CONSTRAINT "OperacionPago_idUsuario_fkey"
    FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Los pagos de Mercado Pago que ya existían pasan a tener su operación.
-- La comisión y el neto no se conocen (quedan vacíos).
INSERT INTO "OperacionPago" ("idExterno", "idUsuario", "estado", "montoTotal", "fechaAprobacion")
SELECT p."idTransaccionExterna",
       MIN(i."idUsuario"),
       'aprobado',
       SUM(p."monto"),
       MIN(p."fechaPago")
FROM "Pago" p
JOIN "Inscripcion" i ON i."id" = p."idInscripcion"
WHERE p."idTransaccionExterna" IS NOT NULL
  AND p."metodo" = 'mercadopago'
GROUP BY p."idTransaccionExterna";
