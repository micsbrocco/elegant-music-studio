-- Preguntas privadas de los alumnos sobre una clase
CREATE TABLE "ConsultaClase" (
    "id" SERIAL NOT NULL,
    "idContenido" INTEGER NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "idAlumno" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respuesta" TEXT,
    "respondidaEn" TIMESTAMP(3),
    "idRespondedor" INTEGER,

    CONSTRAINT "ConsultaClase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsultaClase_idContenido_idAlumno_idx" ON "ConsultaClase"("idContenido", "idAlumno");
CREATE INDEX "ConsultaClase_idCurso_respondidaEn_idx" ON "ConsultaClase"("idCurso", "respondidaEn");

ALTER TABLE "ConsultaClase" ADD CONSTRAINT "ConsultaClase_idContenido_fkey"
    FOREIGN KEY ("idContenido") REFERENCES "Contenido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsultaClase" ADD CONSTRAINT "ConsultaClase_idCurso_fkey"
    FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsultaClase" ADD CONSTRAINT "ConsultaClase_idAlumno_fkey"
    FOREIGN KEY ("idAlumno") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsultaClase" ADD CONSTRAINT "ConsultaClase_idRespondedor_fkey"
    FOREIGN KEY ("idRespondedor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
