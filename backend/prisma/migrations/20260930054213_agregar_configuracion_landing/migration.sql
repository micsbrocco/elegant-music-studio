-- CreateTable
CREATE TABLE "ConfiguracionLanding" (
    "id" INTEGER NOT NULL,
    "contenido" JSONB NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionLanding_pkey" PRIMARY KEY ("id")
);
