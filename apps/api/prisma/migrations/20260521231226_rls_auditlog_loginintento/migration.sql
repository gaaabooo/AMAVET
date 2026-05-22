-- Habilita Row Level Security en AuditLog y LoginIntento, para que sean
-- coherentes con el resto de las tablas del proyecto (User, Mascota, Examen,
-- Cita, PasswordResetToken), que tienen RLS habilitado y forzado. La API
-- accede con el service_role (que omite RLS); esta policy es defensa en
-- profundidad: si algún cliente usara la anon/publishable key, no podría leer
-- ni escribir las trazas de seguridad ni los intentos de login.

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon_audit_log"
  ON "AuditLog"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

ALTER TABLE "LoginIntento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginIntento" FORCE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_anon_login_intento"
  ON "LoginIntento"
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
