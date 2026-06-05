import { Equals, IsEnum, IsOptional } from 'class-validator';
import { EstadoExamen } from '@prisma/client';

export class ActualizarEstadoExamenDto {
  @IsEnum(EstadoExamen)
  estado!: EstadoExamen;

  // Solo se acepta null: el frontend solo manda archivoUrl: null para "borrar
  // PDF" (vuelve el examen a PENDIENTE). La asignacion de una ruta de bucket
  // (cuando se sube un PDF nuevo) ocurre exclusivamente desde subirArchivo()
  // del service, jamas via este endpoint. Antes se validaba con @IsUrl, pero
  // eso filtraba URLs externas que el codigo trataba como ruta de bucket
  // (cualquier https://atacante.com/x.pdf habria pasado y roto generarUrlFirmada).
  @IsOptional()
  @Equals(null)
  archivoUrl?: null;
}
