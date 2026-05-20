-- Habilita Row Level Security en PasswordResetToken para que sea coherente con
-- el resto de las tablas del proyecto (User, Mascota, Examen, Cita), que tienen
-- RLS habilitado y forzado. La API accede con el service_role (que omite RLS);
-- esta policy es defensa en profundidad: si algún día un cliente usara la
-- anon/publishable key, no podría leer ni escribir hashes de tokens de reset.
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" FORCE ROW LEVEL SECURITY;

-- Policy RESTRICTIVE que niega TODO a los roles anon y authenticated. Mismo
-- patrón que deny_all_anon_user / _mascota / _examen / _cita.
CREATE POLICY "deny_all_anon_password_reset_token"
  ON "PasswordResetToken"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
