-- CreateTable
CREATE TABLE "CarritoItem" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "fechaAgregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarritoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" SERIAL NOT NULL,
    "idUsuario" INTEGER NOT NULL,
    "idCurso" INTEGER NOT NULL,
    "fechaAgregado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CarritoItem_idUsuario_idCurso_key" ON "CarritoItem"("idUsuario", "idCurso");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_idUsuario_idCurso_key" ON "Favorito"("idUsuario", "idCurso");

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_idCurso_fkey" FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_idCurso_fkey" FOREIGN KEY ("idCurso") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
