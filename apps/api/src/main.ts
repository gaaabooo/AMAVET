import { setDefaultResultOrder } from 'dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Render no tiene conectividad IPv6 saliente. Forzamos que la resolución DNS
// devuelva direcciones IPv4 primero para evitar ENETUNREACH al conectar a
// servicios externos (APIs HTTP de terceros, etc.).
setDefaultResultOrder('ipv4first');

function assertRequiredEnv() {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }
  if ((process.env.JWT_SECRET ?? '').length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
}

async function bootstrap() {
  assertRequiredEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean)
      : []),
  ];

  const allowedVercelPattern = process.env.ALLOWED_VERCEL_PATTERN;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (allowedVercelPattern) {
        try {
          if (new RegExp(allowedVercelPattern).test(origin)) return callback(null, true);
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

bootstrap().catch((err) => {
  Logger.error(`Error iniciando la aplicación: ${err.message}`, 'Bootstrap');
  process.exit(1);
});
