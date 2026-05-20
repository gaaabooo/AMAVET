-- AlterTable
-- Claim "tv" del JWT. Se incrementa al cambiar la contraseña para invalidar
-- las sesiones (tokens) emitidos antes del cambio.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
