-- AlterTable
-- Soft-delete de cuentas. null = cuenta activa. Al eliminar la cuenta se marca
-- con la fecha; tras 30 días la purga la borra definitivamente.
ALTER TABLE "User" ADD COLUMN "eliminadoEn" TIMESTAMP(3);

-- CreateIndex
-- La purga consulta cuentas con eliminadoEn vencido; el índice acelera ese barrido.
CREATE INDEX "User_eliminadoEn_idx" ON "User"("eliminadoEn");
