import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registro')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  registro(@Body() body: RegistroDto) {
    return this.authService.registro(body.nombre, body.email, body.telefono, body.password);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  loginGoogle(@Body() body: GoogleLoginDto) {
    return this.authService.loginConGoogle(body.accessToken);
  }
}
