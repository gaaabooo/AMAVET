import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { ActualizarEstadoCitaDto } from './dto/actualizar-estado-cita.dto';

interface RequestConUsuario {
  user: { userId: string; email: string; rol: 'TUTOR' | 'ADMIN' };
}

@Controller('citas')
@UseGuards(JwtAuthGuard)
export class CitasController {
  constructor(private citasService: CitasService) {}

  @Post()
  async crear(@Req() req: RequestConUsuario, @Body() body: CrearCitaDto) {
    if (req.user.rol !== 'ADMIN') {
      const esDueno = await this.citasService.esDuenoDeMascota(
        body.mascotaId,
        req.user.userId,
      );
      if (!esDueno) {
        throw new ForbiddenException(
          'Solo puedes agendar citas para tus propias mascotas',
        );
      }
    }
    return this.citasService.crear(
      body.fecha,
      body.direccion,
      body.servicios,
      body.mascotaId,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listarTodas() {
    return this.citasService.listarTodas();
  }

  @Get('mascota/:mascotaId')
  async listarPorMascota(
    @Req() req: RequestConUsuario,
    @Param('mascotaId', new ParseUUIDPipe()) mascotaId: string,
  ) {
    if (req.user.rol !== 'ADMIN') {
      const esDueno = await this.citasService.esDuenoDeMascota(
        mascotaId,
        req.user.userId,
      );
      if (!esDueno) {
        throw new ForbiddenException('No tienes acceso a estas citas');
      }
    }
    return this.citasService.listarPorMascota(mascotaId);
  }

  @Patch(':id/estado')
  async actualizarEstado(
    @Req() req: RequestConUsuario,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: ActualizarEstadoCitaDto,
  ) {
    if (req.user.rol !== 'ADMIN') {
      const cita = await this.citasService.buscarPorId(id);
      if (!cita) throw new NotFoundException('Cita no encontrada');
      if (cita.mascota.tutorId !== req.user.userId) {
        throw new ForbiddenException('No puedes modificar esta cita');
      }
      // Tutores solo pueden cancelar sus propias citas.
      if (body.estado !== 'CANCELADA') {
        throw new ForbiddenException('Solo puedes cancelar tus citas');
      }
    }
    return this.citasService.actualizarEstado(id, body.estado);
  }
}
