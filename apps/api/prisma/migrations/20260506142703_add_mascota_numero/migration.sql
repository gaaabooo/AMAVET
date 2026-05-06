-- 1. Crear secuencia para el correlativo global
CREATE SEQUENCE "Mascota_numero_seq";

-- 2. Agregar columna numero. Default = nextval para autoincrement.
ALTER TABLE "Mascota"
  ADD COLUMN "numero" INTEGER NOT NULL DEFAULT nextval('"Mascota_numero_seq"');

-- 3. Asignar números a filas existentes en orden de creación.
--    Reseteamos la secuencia y asignamos numero según creadoEn ASC.
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "creadoEn" ASC) AS rn
  FROM "Mascota"
)
UPDATE "Mascota" m
SET "numero" = ordered.rn
FROM ordered
WHERE m."id" = ordered."id";

-- 4. Vincular secuencia a la columna y avanzarla al próximo valor libre.
ALTER SEQUENCE "Mascota_numero_seq" OWNED BY "Mascota"."numero";
SELECT setval('"Mascota_numero_seq"', COALESCE((SELECT MAX("numero") FROM "Mascota"), 0) + 1, false);

-- 5. Constraint de unicidad.
CREATE UNIQUE INDEX "Mascota_numero_key" ON "Mascota"("numero");
