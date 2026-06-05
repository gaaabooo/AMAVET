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
import { Throttle } from '@nestjs/throttler';
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

// JwtAuthGuard a nivel de clase: todos los endpoints exigen JWT por defecto.
// Sin esto, un endpoint nuevo que olvide @UseGuards queda publico. Los
// endpoints que ademas exigen rol ADMIN añaden RolesGuard y @Roles arriba.
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('tutores')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listarTutores() {
    return this.usersService.listarTutores();
  }

  @Patch(':id')
  actualizarPerfil(
    @Req() req: RequestConUsuario,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ActualizarPerfilDto,
  ) {
    asegurarSelfOAdmin(req, id);
    return this.usersService.actualizarPerfil(id, body);
  }

  // Throttle dedicado: aunque el endpoint exige JWT, un atacante con un token
  // robado podria sostener intentos de adivinar la passwordActual. Con Argon2id
  // (~200ms/hash) y este limite, la fuerza bruta queda en 5 intentos/min por
  // IP, que sumado al lockout no es practicable.
  @Patch(':id/password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
