-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificacionExpira" TIMESTAMP(3),
ADD COLUMN     "verificacionToken" TEXT;
