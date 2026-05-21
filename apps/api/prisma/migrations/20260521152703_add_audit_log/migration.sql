-- CreateTable
-- Bitácora de seguridad persistente. Cada evento auditable deja una fila.
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evento" TEXT NOT NULL,
    "alerta" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "ip" TEXT,
    "datos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_evento_creadoEn_idx" ON "AuditLog"("evento", "creadoEn");

-- CreateIndex
CREATE INDEX "AuditLog_userId_creadoEn_idx" ON "AuditLog"("userId", "creadoEn");

-- CreateIndex
CREATE INDEX "AuditLog_creadoEn_idx" ON "AuditLog"("creadoEn");
