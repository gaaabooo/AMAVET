import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

interface RequestConUsuario {
  user: { userId: string; email: string; rol: 'TUTOR' | 'ADMIN' };
}

function asegurarSelfOAdmin(req: RequestConUsuario, idObjetivo: string) {
  if (req.user.rol === 'ADMIN') return;
  if (req.user.userId !== idObjetivo) {
    throw new ForbiddenException('Solo puedes modificar tu propio perfil');
  }
}

@Controller('usuarios')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('tutores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  listarTutores() {
    return this.usersService.listarTutores();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  actualizarPerfil(
    @Req() req: RequestConUsuario,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ActualizarPerfilDto,
  ) {
    asegurarSelfOAdmin(req, id);
    return this.usersService.actualizarPerfil(id, body);
  }

  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  cambiarPassword(
    @Req() req: RequestConUsuario,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: CambiarPasswordDto,
  ) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('Solo puedes cambiar tu propia contraseña');
    }
    return this.usersService.cambiarPassword(
      id,
      body.passwordActual,
      body.passwordNueva,
    );
  }
}
