import { setDefaultResultOrder } from 'dns';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { Application } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { smokeTestArgon2 } from './common/password';

// Render no tiene conectividad IPv6 saliente. Forzamos que la resolución DNS
// devuelva direcciones IPv4 primero para evitar ENETUNREACH al conectar a
// servicios externos (APIs HTTP de terceros, etc.).
setDefaultResultOrder('ipv4first');

function assertRequiredEnv() {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}`,
    );
  }
  if ((process.env.JWT_SECRET ?? '').length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
}

async function bootstrap() {
  assertRequiredEnv();

  // Verifica que el binario nativo de Argon2 funciona antes de aceptar
  // tráfico: si falla, es mejor no arrancar que rechazar todas las
  // contraseñas en producción de forma silenciosa.
  await smokeTestArgon2();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // En producción la API corre detrás del proxy de Render: sin "trust proxy"
  // Express ve la IP del proxy, no la del cliente, y el rate-limiting por IP
  // agruparía a todos los usuarios bajo una sola IP. TRUST_PROXY indica cuántos
  // saltos de proxy confiar (Render = 1). Se confía en un número exacto, NO en
  // "true": así un cliente no puede falsear su IP con la cabecera
  // X-Forwarded-For. En local (sin proxy) debe quedar en 0.
  const trustProxy = Number(process.env.TRUST_PROXY ?? 0);
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.set('trust proxy', trustProxy);

  app.use(
    helmet({
      // La API solo sirve JSON, no HTML: una CSP aquí no aporta (no se
      // renderiza nada). La CSP de cara al usuario está en el frontend
      // (apps/web/next.config.ts).
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // HSTS explícito: instruye al navegador/clientes a usar siempre HTTPS
      // durante 2 años. Render ya fuerza HTTPS; esto cierra el primer request.
      hsts: {
        maxAge: 63_072_000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // La API solo devuelve datos privados y autenticados (PII, datos clínicos,
  // URLs firmadas). Nunca debe cachearse: ni en el navegador ni en proxies.
  app.use(
    (
      _req: unknown,
      res: { setHeader: (k: string, v: string) => void },
      next: () => void,
    ) => {
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Traduce los errores conocidos de Prisma a códigos HTTP correctos (409, 404,
  // 400) en vez de dejarlos caer como 500 genérico.
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaExceptionFilter(httpAdapterHost.httpAdapter));

  const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
          .map((u) => u.trim())
          .filter(Boolean)
      : []),
  ];

  const allowedVercelPattern = process.env.ALLOWED_VERCEL_PATTERN;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (allowedVercelPattern) {
        try {
          if (new RegExp(allowedVercelPattern).test(origin))
            return callback(null, true);
        } catch {
          // patrón inválido — ignorar y continuar
        }
      }
      return callback(new Error(`Origin no permitido: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API escuchando en puerto ${port}`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  const mensaje = err instanceof Error ? err.message : String(err);
  Logger.error(`Error iniciando la aplicación: ${mensaje}`, 'Bootstrap');
  process.exit(1);
});
