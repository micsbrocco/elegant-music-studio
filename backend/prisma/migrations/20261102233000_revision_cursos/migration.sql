-- Solicitud de publicación de cursos de instructores
ALTER TABLE "Curso" ADD COLUMN "revisionSolicitadaEn" TIMESTAMP(3);
ALTER TABLE "Curso" ADD COLUMN "comentarioRevision" TEXT;
