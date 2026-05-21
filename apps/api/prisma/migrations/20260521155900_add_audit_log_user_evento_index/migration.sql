-- CreateIndex
-- Índice para la detección de login desde IP nueva, que cuenta los inicios de
-- sesión de un usuario por evento (y opcionalmente filtrando por ip).
CREATE INDEX "AuditLog_userId_evento_ip_idx" ON "AuditLog"("userId", "evento", "ip");
