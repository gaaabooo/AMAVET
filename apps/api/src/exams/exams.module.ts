import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { SupabaseService } from '../supabase.service';
import { NotificacionesModule } from '../notificaciones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, NotificacionesModule],
  controllers: [ExamsController],
  providers: [ExamsService, SupabaseService],
})
export class ExamsModule {}
