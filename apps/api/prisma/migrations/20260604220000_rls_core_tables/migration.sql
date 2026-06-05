-- Habilita Row Level Security en las 4 tablas core (User, Mascota, Examen,
-- Cita), para que el repo sea la fuente de verdad de la postura de RLS.
-- En produccion estas tablas ya tienen RLS aplicado manualmente en Supabase
-- desde el inicio del proyecto; esta migracion las versiona para que cualquier
-- entorno nuevo (staging, restauracion de backup, migracion a otro proyecto)
-- las reciba sin pasos manuales.
--
-- La API accede con la service_role key (que omite RLS); esta policy es
-- defensa en profundidad: si algun cliente usara la anon/publishable key
-- (que esta embebida en el bundle de Vercel y por tanto es publica), no
-- podria leer ni escribir ninguna de estas tablas.
--
-- Idempotente: usa DROP POLICY IF EXISTS antes de CREATE para que la
-- migracion no falle en produccion donde las policies ya existen. ENABLE y
-- FORCE ROW LEVEL SECURITY tambien son idempotentes (PostgreSQL no falla si
-- ya estan habilitados).

-- User
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_user" ON "User";
CREATE POLICY "deny_all_anon_user"
  ON "User"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Mascota
ALTER TABLE "Mascota" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Mascota" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_mascota" ON "Mascota";
CREATE POLICY "deny_all_anon_mascota"
  ON "Mascota"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Examen
ALTER TABLE "Examen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Examen" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_examen" ON "Examen";
CREATE POLICY "deny_all_anon_examen"
  ON "Examen"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Cita
ALTER TABLE "Cita" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cita" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_cita" ON "Cita";
CREATE POLICY "deny_all_anon_cita"
  ON "Cita"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
