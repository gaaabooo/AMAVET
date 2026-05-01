import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registro')
  registro(
    @Body() body: { nombre: string; email: string; telefono: string; password: string },
  ) {
    return this.authService.registro(body.nombre, body.email, body.telefono, body.password);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}