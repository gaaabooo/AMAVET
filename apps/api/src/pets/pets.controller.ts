import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
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

// Mascota.numero es un autoincrement global. Devolvérselo al tutor permite
// enumerar el total de mascotas del sistema. Solo ADMIN lo recibe.
function ocultarNumeroSiTutor<T extends { numero?: number } | null>(
  rol: 'TUTOR' | 'ADMIN',
  mascota: T,
): T {
  if (rol === 'ADMIN' || mascota == null) return mascota;
  const copia = { ...mascota };
  delete copia.numero;
  return copia;
}

@Controller('mascotas')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Post()
  crear(@Req() req: RequestConUsuario, @Body() body: CrearMascotaDto) {
    // El tutorId NUNCA se confía del body para tutores normales: se deriva del
    // JWT. Solo ADMIN puede crear mascotas para otro tutor explícitamente.
    const tutorId =
      req.user.rol === 'ADMIN' && body.tutorId ? body.tutorId : req.user.userId;
    return this.petsService
      .crear(
        body.nombre,
        body.tipo,
        body.raza ?? null,
        body.edad ?? null,
        tutorId,
      )
      .then((m) => ocultarNumeroSiTutor(req.user.rol, m));
  }

  @Get('tutor/:tutorId')
  async listarPorTutor(
    @Req() req: RequestConUsuario,
    @Param('tutorId', new ParseUUIDPipe()) tutorId: string,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.userId !== tutorId) {
      throw new ForbiddenException('Solo puedes ver tus propias mascotas');
    }
    const mascotas = await this.petsService.listarPorTutor(tutorId);
    return mascotas.map((m) => ocultarNumeroSiTutor(req.user.rol, m));
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
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const mascota = await this.petsService.buscarPorId(id);
    if (!mascota) throw new NotFoundException('Mascota no encontrada');
    if (req.user.rol !== 'ADMIN' && req.user.userId !== mascota.tutorId) {
      throw new ForbiddenException('No tienes acceso a esta mascota');
    }
    return ocultarNumeroSiTutor(req.user.rol, mascota);
  }
}
