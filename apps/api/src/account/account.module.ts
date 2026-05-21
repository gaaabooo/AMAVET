import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { SupabaseService } from '../supabase.service';
import { NotificacionesModule } from '../notificaciones.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule, NotificacionesModule],
  controllers: [AccountController],
  providers: [AccountService, SupabaseService],
})
export class AccountModule {}
