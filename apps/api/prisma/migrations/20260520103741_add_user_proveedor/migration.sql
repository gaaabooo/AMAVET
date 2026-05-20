-- CreateEnum
CREATE TYPE "Proveedor" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
-- Origen de la cuenta. Por defecto LOCAL. El backfill deja todas las cuentas
-- existentes como LOCAL: las cuentas creadas vía Google que todavía no
-- completaron su perfil se reconocen además por telefono = 'PENDIENTE', y de
-- aquí en adelante el flujo de Google marca proveedor = 'GOOGLE' explícitamente.
ALTER TABLE "User" ADD COLUMN "proveedor" "Proveedor" NOT NULL DEFAULT 'LOCAL';

-- Backfill: las cuentas con teléfono en el sentinel PENDIENTE fueron creadas
-- por Google y aún no completan perfil; márcalas como GOOGLE.
UPDATE "User" SET "proveedor" = 'GOOGLE' WHERE "telefono" = 'PENDIENTE';
