import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditAlertService } from './audit-alert.service';
import { NotificacionesModule } from '../notificaciones.module';

// Global: AuditService queda disponible para inyección en cualquier módulo sin
// necesidad de importar AuditModule en cada uno.
@Global()
@Module({
  imports: [NotificacionesModule],
  providers: [AuditService, AuditAlertService],
  exports: [AuditService],
})
export class AuditModule {}
