import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuditModule } from './common/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PetsModule } from './pets/pets.module';
import { ExamsModule } from './exams/exams.module';
import { CitasModule } from './citas/citas.module';
import { AccountModule } from './account/account.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1_000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
      { name: 'long', ttl: 3_600_000, limit: 1_000 },
      // Throttler "default" para que los @Throttle({ default: { ... } }) por
      // endpoint funcionen como override. Sin este throttler registrado,
      // @nestjs/throttler v6 ignora silenciosamente el decorador y solo
      // aplican los limites globales de arriba, dejando inactivos los
      // limites estrictos de /auth/login, /auth/registro, etc.
      { name: 'default', ttl: 60_000, limit: 1_000 },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    PetsModule,
    ExamsModule,
    CitasModule,
    AccountModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
