import { Module } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { NotificacionesModule } from '../notificaciones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, NotificacionesModule],
  controllers: [CitasController],
  providers: [CitasService],
})
export class CitasModule {}
