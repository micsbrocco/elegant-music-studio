-- Mensajes del admin al instructor: leído (instructor) y realizado (admin)
ALTER TABLE "MensajeRevision" ADD COLUMN "leidoEn" TIMESTAMP(3);
ALTER TABLE "MensajeRevision" ADD COLUMN "resueltoEn" TIMESTAMP(3);

-- Los mensajes de cursos ya publicados, o que no son el último pedido del curso, quedan como realizados
UPDATE "MensajeRevision" m SET "resueltoEn" = CURRENT_TIMESTAMP
FROM "Curso" c
WHERE c."id" = m."idCurso"
  AND (c."estado" = 'activo' OR c."comentarioRevision" IS NULL OR m."texto" <> c."comentarioRevision");
