import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CrearMascotaDto } from './dto/crear-mascota.dto';

interface RequestConUsuario {
  user: { userId: string; email: string; rol: 'TUTOR' | 'ADMIN' };
}

@Controller('mascotas')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Post()
  crear(@Req() req: RequestConUsuario, @Body() body: CrearMascotaDto) {
    if (req.user.rol !== 'ADMIN' && req.user.userId !== body.tutorId) {
      throw new ForbiddenException('Solo puedes crear mascotas asociadas a tu propio usuario');
    }
    return this.petsService.crear(body.nombre, body.tipo, body.raza ?? null, body.edad ?? null, body.tutorId);
  }

  @Get('tutor/:tutorId')
  listarPorTutor(
    @Req() req: RequestConUsuario,
    @Param('tutorId', new ParseUUIDPipe()) tutorId: string,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.userId !== tutorId) {
      throw new ForbiddenException('Solo puedes ver tus propias mascotas');
    }
    return this.petsService.listarPorTutor(tutorId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listarTodas() {
    return this.petsService.listarTodas();
  }

  @Get(':id')
  async buscarPorId(
    @Req() req: RequestConUsuario,
    @Param('id') id: string,
  ) {
    const mascota = await this.petsService.buscarPorId(id);
    if (!mascota) return null;
    if (req.user.rol !== 'ADMIN' && req.user.userId !== mascota.tutorId) {
      throw new ForbiddenException('No tienes acceso a esta mascota');
    }
    return mascota;
  }
}
