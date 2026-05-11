import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistroDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  nombre!: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @IsString()
  @Length(7, 20)
  @Matches(/^\+?[0-9 ()-]+$/, { message: 'telefono contiene caracteres inválidos' })
  telefono!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
