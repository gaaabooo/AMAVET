import { Controller, Get, Post, Patch, Body, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamsService } from './exams.service';
import { EstadoExamen } from '@prisma/client';

@Controller('examenes')
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post()
  crear(@Body() body: { tipo: string; mascotaId: string }) {
    return this.examsService.crear(body.tipo, body.mascotaId);
  }

  @Get('mascota/:mascotaId')
  listarPorMascota(@Param('mascotaId') mascotaId: string) {
    return this.examsService.listarPorMascota(mascotaId);
  }

  @Get()
  listarTodos() {
    return this.examsService.listarTodos();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.examsService.buscarPorId(id);
  }

  @Patch(':id/estado')
  actualizarEstado(
    @Param('id') id: string,
    @Body() body: { estado: EstadoExamen; archivoUrl?: string },
  ) {
    return this.examsService.actualizarEstado(id, body.estado, body.archivoUrl);
  }

  @Post(':id/subir')
  @UseInterceptors(FileInterceptor('archivo'))
  async subirArchivo(
    @Param('id') id: string,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.examsService.subirArchivo(id, archivo);
  }
}