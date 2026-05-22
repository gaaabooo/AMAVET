-- Cada examen pasa a pertenecer a una cita (la que lo solicitó). La tabla
-- Examen estaba vacía al aplicar esta migración, por eso la columna se agrega
-- como NOT NULL sin valor por defecto. "citaId" es TEXT para coincidir con
-- "Cita"."id" (que es TEXT en esta base).

-- AlterTable
ALTER TABLE "Examen" ADD COLUMN "citaId" TEXT NOT NULL;

-- CreateIndex: un mismo tipo de examen no puede repetirse dentro de la misma cita.
CREATE UNIQUE INDEX "Examen_citaId_tipo_key" ON "Examen"("citaId", "tipo");

-- CreateIndex
CREATE INDEX "Examen_citaId_idx" ON "Examen"("citaId");

-- AddForeignKey
ALTER TABLE "Examen" ADD CONSTRAINT "Examen_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE CASCADE ON UPDATE CASCADE;
