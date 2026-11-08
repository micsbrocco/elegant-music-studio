-- Registro de altas y bajas de instructores
CREATE TABLE "HistorialInstructor" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idAdmin" INTEGER,
    "nombreAdmin" TEXT,
    "nota" TEXT,

    CONSTRAINT "HistorialInstructor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HistorialInstructor_fecha_idx" ON "HistorialInstructor"("fecha");

ALTER TABLE "HistorialInstructor" ADD CONSTRAINT "HistorialInstructor_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HistorialInstructor" ADD CONSTRAINT "HistorialInstructor_idAdmin_fkey" FOREIGN KEY ("idAdmin") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Los instructores que ya existían quedan registrados con un alta inicial
-- (no se sabe la fecha real, así que se usa la de hoy y se aclara en la nota)
INSERT INTO "HistorialInstructor" ("idUsuario", "nombre", "email", "accion", "fecha", "nota")
SELECT "id", "nombre" || ' ' || "apellido", "email", 'alta', CURRENT_TIMESTAMP, 'Ya era instructor al activar el registro'
FROM "Usuario" WHERE "rol" = 'profesor';
