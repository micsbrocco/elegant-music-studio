-- Historial de comentarios del administrador al devolver un curso
CREATE TABLE "MensajeRevision" (
    "id" SERIAL NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "idAutor" INTEGER,
    "texto" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MensajeRevision_idCurso_creadoEn_idx" ON "MensajeRevision"("idCurso", "creadoEn");

ALTER TABLE "MensajeRevision" ADD CONSTRAINT "MensajeRevision_idCurso_fkey" FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MensajeRevision" ADD CONSTRAINT "MensajeRevision_idAutor_fkey" FOREIGN KEY ("idAutor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Los comentarios que ya estaban pendientes pasan al historial
INSERT INTO "MensajeRevision" ("idCurso", "texto")
SELECT "id", "comentarioRevision" FROM "Curso" WHERE "comentarioRevision" IS NOT NULL AND "comentarioRevision" <> '';
