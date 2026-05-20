import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class OlvidePasswordDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  // Token de Cloudflare Turnstile. Lo valida TurnstileGuard; opcional en el DTO
  // para no romper la petición cuando Turnstile aún no está configurado.
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  captchaToken?: string;
}
