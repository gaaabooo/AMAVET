import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearMascotaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Transform(({ value }: { value: string }) => value?.trim())
  nombre!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(({ value }: { value: string }) => value?.trim())
  tipo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }: { value: string }) => value?.trim())
  raza?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  edad?: number;

  // Solo lo usa ADMIN para crear mascotas para otro tutor. Para tutores
  // normales el tutorId se deriva del JWT y este campo se ignora.
  @IsOptional()
  @IsUUID()
  tutorId?: string;
}
