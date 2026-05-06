import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('usuarios')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('tutores')
  listarTutores() {
    return this.usersService.listarTutores();
  }

  @Patch(':id')
  actualizarPerfil(
    @Param('id') id: string,
    @Body() body: { nombre?: string; telefono?: string },
  ) {
    return this.usersService.actualizarPerfil(id, body);
  }

  @Patch(':id/password')
  cambiarPassword(
    @Param('id') id: string,
    @Body() body: { passwordActual: string; passwordNueva: string },
  ) {
    return this.usersService.cambiarPassword(id, body.passwordActual, body.passwordNueva);
  }
}
