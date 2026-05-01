import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PetsService } from './pets.service';

@Controller('mascotas')
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Post()
  crear(@Body() body: { nombre: string; tipo: string; raza: string; edad: number; tutorId: string }) {
    return this.petsService.crear(body.nombre, body.tipo, body.raza, body.edad, body.tutorId);
  }

  @Get('tutor/:tutorId')
  listarPorTutor(@Param('tutorId') tutorId: string) {
    return this.petsService.listarPorTutor(tutorId);
  }

  @Get()
  listarTodas() {
    return this.petsService.listarTodas();
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.petsService.buscarPorId(id);
  }
}