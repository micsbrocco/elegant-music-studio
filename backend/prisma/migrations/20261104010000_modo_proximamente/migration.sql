-- Interruptor "Próximamente" del sitio
CREATE TABLE "ConfiguracionSitio" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "modoProximamente" BOOLEAN NOT NULL DEFAULT false,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionSitio_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ConfiguracionSitio" ("id", "modoProximamente", "actualizadoEn") VALUES (1, false, CURRENT_TIMESTAMP);

-- Como todas las tablas: sin acceso desde la API pública de Supabase
ALTER TABLE "ConfiguracionSitio" ENABLE ROW LEVEL SECURITY;
