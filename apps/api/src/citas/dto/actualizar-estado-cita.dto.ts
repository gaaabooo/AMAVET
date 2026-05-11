import { IsEnum } from 'class-validator';
import { EstadoCita } from '@prisma/client';

export class ActualizarEstadoCitaDto {
  @IsEnum(EstadoCita)
  estado!: EstadoCita;
}
