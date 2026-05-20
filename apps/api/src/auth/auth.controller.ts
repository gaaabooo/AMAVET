import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { OlvidePasswordDto } from './dto/olvide-password.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('registro')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  registro(@Body() body: RegistroDto) {
    return this.authService.registro(
      body.nombre,
      body.email,
      body.telefono,
      body.password,
    );
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto, @Ip() ip: string) {
    return this.authService.login(body.email, body.password, ip);
  }

  @Post('google')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  loginGoogle(@Body() body: GoogleLoginDto) {
    return this.authService.loginConGoogle(body.accessToken);
  }

  @Post('olvide-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  olvidePassword(@Body() body: OlvidePasswordDto, @Ip() ip: string) {
    return this.passwordResetService.solicitarReset(body.email, ip);
  }

  @Post('restablecer-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  restablecerPassword(@Body() body: RestablecerPasswordDto) {
    return this.passwordResetService.confirmarReset(
      body.token,
      body.passwordNueva,
    );
  }
}
