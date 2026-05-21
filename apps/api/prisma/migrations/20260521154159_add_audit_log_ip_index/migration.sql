-- CreateIndex
-- Índice para la detección de fuerza bruta, que cuenta eventos por ip + evento
-- dentro de una ventana de tiempo.
CREATE INDEX "AuditLog_ip_evento_creadoEn_idx" ON "AuditLog"("ip", "evento", "creadoEn");
