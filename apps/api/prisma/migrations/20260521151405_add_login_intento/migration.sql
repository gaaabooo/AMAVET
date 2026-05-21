-- CreateTable
-- Registro de intentos de login para el lockout escalonado tras N fallos.
CREATE TABLE "LoginIntento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "exitoso" BOOLEAN NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginIntento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Índice compuesto para contar los fallos recientes de una combinación email+ip.
CREATE INDEX "LoginIntento_email_ip_creadoEn_idx" ON "LoginIntento"("email", "ip", "creadoEn");

-- CreateIndex
-- Índice para la purga oportunista de filas antiguas.
CREATE INDEX "LoginIntento_creadoEn_idx" ON "LoginIntento"("creadoEn");
