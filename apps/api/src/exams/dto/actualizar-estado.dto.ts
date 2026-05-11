import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { EstadoExamen } from '@prisma/client';

export class ActualizarEstadoExamenDto {
  @IsEnum(EstadoExamen)
  estado!: EstadoExamen;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true, require_tld: true, protocols: ['https'] })
  archivoUrl?: string | null;
}
