import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();