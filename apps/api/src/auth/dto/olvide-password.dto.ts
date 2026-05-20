import { IsEmail, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class OlvidePasswordDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;
}
