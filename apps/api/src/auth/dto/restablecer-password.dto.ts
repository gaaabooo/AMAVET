import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RestablecerPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  passwordNueva!: string;
}
