-- Alumnos activos / inactivos
ALTER TABLE "Usuario" ADD COLUMN "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "activo" BOOLEAN NOT NULL DEFAULT true;

-- Borrado lógico de cursos (estado "archivado")
ALTER TABLE "Curso" ADD COLUMN "archivadoEn" TIMESTAMP(3);

-- La última actividad de los usuarios que ya existían se toma de lo último que
-- hicieron: registrarse, completar una clase, responder un quiz o pagar.
UPDATE "Usuario" u SET "ultimaActividad" = GREATEST(
  u."fechaRegistro",
  COALESCE((SELECT MAX(p."fecha") FROM "Progreso" p JOIN "Inscripcion" i ON i."id" = p."idInscripcion" WHERE i."idUsuario" = u."id"), u."fechaRegistro"),
  COALESCE((SELECT MAX(r."fecha") FROM "RespuestaPregunta" r WHERE r."idUsuario" = u."id"), u."fechaRegistro"),
  COALESCE((SELECT MAX(pg."fechaPago") FROM "Pago" pg JOIN "Inscripcion" i ON i."id" = pg."idInscripcion" WHERE i."idUsuario" = u."id"), u."fechaRegistro")
);

-- Índices para los filtros del panel
CREATE INDEX "Usuario_rol_activo_idx" ON "Usuario"("rol", "activo");
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");
