-- El alumno ya vio la respuesta a su pregunta
ALTER TABLE "ConsultaClase" ADD COLUMN "respuestaVista" BOOLEAN NOT NULL DEFAULT false;

-- Las que ya estaban respondidas se dan por vistas (ya les llegó el mail)
UPDATE "ConsultaClase" SET "respuestaVista" = true WHERE "respondidaEn" IS NOT NULL;
