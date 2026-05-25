-- Agrega marca de cuándo se subió el PDF del examen (paso a DISPONIBLE).
-- Distinta de creadoEn: el examen se crea junto con la cita, pero el resultado
-- llega días después. Vuelve a null si el equipo "borra el PDF" para resubirlo.
ALTER TABLE "Examen" ADD COLUMN "subidoEn" TIMESTAMP(3);

-- Backfill: para los exámenes ya DISPONIBLE no hay registro real de cuándo se
-- subió el PDF, así que usamos actualizadoEn como aproximación razonable
-- (corresponde a la última transición de estado, que suele ser la subida).
UPDATE "Examen"
SET "subidoEn" = "actualizadoEn"
WHERE "estado" = 'DISPONIBLE' AND "subidoEn" IS NULL;
