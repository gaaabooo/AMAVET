import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(7, 20)
  @Matches(/^\+?[0-9 ()-]+$/, {
    message: 'telefono contiene caracteres inválidos',
  })
  telefono?: string;
}
