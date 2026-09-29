-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'alumno',
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "categoria" TEXT NOT NULL,
    "imagenPortada" TEXT,
    "idAdminCreador" INTEGER NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" SERIAL NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenidoTexto" TEXT,
    "urlVideo" TEXT,
    "archivoDescargable" TEXT,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "fechaInscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "idInscripcion" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL,
    "idTransaccionExterna" TEXT,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progreso" (
    "id" SERIAL NOT NULL,
    "idInscripcion" INTEGER NOT NULL,
    "idModulo" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Progreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pregunta" (
    "id" SERIAL NOT NULL,
    "idModulo" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "opcionA" TEXT NOT NULL,
    "opcionB" TEXT NOT NULL,
    "opcionC" TEXT NOT NULL,
    "opcionD" TEXT NOT NULL,
    "respuestaCorrecta" TEXT NOT NULL,

    CONSTRAINT "Pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" SERIAL NOT NULL,
    "idInscripcion" INTEGER NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigoVerificacion" TEXT NOT NULL,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_idInscripcion_key" ON "Pago"("idInscripcion");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_idInscripcion_key" ON "Certificado"("idInscripcion");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_codigoVerificacion_key" ON "Certificado"("codigoVerificacion");

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_idAdminCreador_fkey" FOREIGN KEY ("idAdminCreador") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modulo" ADD CONSTRAINT "Modulo_idCurso_fkey" FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_idCurso_fkey" FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_idInscripcion_fkey" FOREIGN KEY ("idInscripcion") REFERENCES "Inscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progreso" ADD CONSTRAINT "Progreso_idInscripcion_fkey" FOREIGN KEY ("idInscripcion") REFERENCES "Inscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progreso" ADD CONSTRAINT "Progreso_idModulo_fkey" FOREIGN KEY ("idModulo") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregunta" ADD CONSTRAINT "Pregunta_idModulo_fkey" FOREIGN KEY ("idModulo") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_idInscripcion_fkey" FOREIGN KEY ("idInscripcion") REFERENCES "Inscripcion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
