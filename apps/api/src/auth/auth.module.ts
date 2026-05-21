import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginLockoutService } from './login-lockout.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseService } from '../supabase.service';
import { TurnstileService } from '../common/turnstile.service';
import { TurnstileGuard } from '../common/turnstile.guard';
import { NotificacionesModule } from '../notificaciones.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    NotificacionesModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET no está definido');
        const expiresIn = (process.env.JWT_EXPIRES_IN ??
          '24h') as `${number}${'s' | 'm' | 'h' | 'd'}`;
        return {
          secret,
          signOptions: {
            expiresIn,
            issuer: 'amavet-api',
          },
        };
      },
    }),
  ],
  providers: [
    AuthService,
    PasswordResetService,
    LoginLockoutService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    SupabaseService,
    TurnstileService,
    TurnstileGuard,
  ],
  controllers: [AuthController],
  exports: [JwtStrategy, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
