import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CitasService } from './citas.service';
import { EstadoCita } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('citas')
@UseGuards(JwtAuthGuard)
export class CitasController {
  constructor(private citasService: CitasService) {}

  @Post()
  crear(@Body() body: { fecha: string; direccion: string; servicios: string[]; mascotaId: string }) {
    return this.citasService.crear(body.fecha, body.direccion, body.servicios, body.mascotaId);
  }

  @Get()
  listarTodas() {
    return this.citasService.listarTodas();
  }

  @Get('mascota/:mascotaId')
  listarPorMascota(@Param('mascotaId') mascotaId: string) {
    return this.citasService.listarPorMascota(mascotaId);
  }

  @Patch(':id/estado')
  actualizarEstado(@Param('id') id: string, @Body() body: { estado: EstadoCita }) {
    return this.citasService.actualizarEstado(id, body.estado);
  }
}
