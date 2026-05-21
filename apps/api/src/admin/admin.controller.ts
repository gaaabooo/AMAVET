import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditQueryService } from '../common/audit-query.service';

// Catálogo de eventos válidos como filtro (coincide con EventoAuditoria).
const EVENTOS_VALIDOS = [
  'LOGIN_OK',
  'LOGIN_FALLIDO',
  'LOGIN_GOOGLE_OK',
  'REGISTRO_OK',
  'REGISTRO_EMAIL_DUPLICADO',
  'PASSWORD_CAMBIADA',
  'PASSWORD_RESET_SOLICITADO',
  'PASSWORD_RESET_CONFIRMADO',
  'EXAMEN_CREADO',
  'EXAMEN_ESTADO_ACTUALIZADO',
  'EXAMEN_ARCHIVO_SUBIDO',
  'CUENTA_ELIMINADA',
  'CUENTA_REACTIVADA',
  'CUENTA_PURGADA',
];

class ConsultaAuditoriaDto {
  @IsOptional()
  @IsIn(EVENTOS_VALIDOS)
  evento?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsBooleanString()
  soloAlertas?: string;

  // Página acotada: entero entre 1 y 10000. Evita un OFFSET absurdo que
  // degradaría la BD con un scan masivo.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  pagina?: number;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private auditQuery: AuditQueryService) {}

  /**
   * Consulta del audit trail de seguridad. Solo ADMIN. Admite filtros por
   * evento, usuario y "solo alertas", con paginación.
   */
  @Get('auditoria')
  auditoria(@Query() q: ConsultaAuditoriaDto) {
    return this.auditQuery.listar({
      evento: q.evento,
      userId: q.userId,
      soloAlertas: q.soloAlertas === 'true',
      pagina: q.pagina ?? 1,
    });
  }
}
