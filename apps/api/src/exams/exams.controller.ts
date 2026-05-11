import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CrearExamenDto } from './dto/crear-examen.dto';
import { ActualizarEstadoExamenDto } from './dto/actualizar-estado.dto';

interface RequestConUsuario {
  user: { userId: string; email: string; rol: 'TUTOR' | 'ADMIN' };
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Controller('examenes')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  crear(@Body() body: CrearExamenDto) {
    return this.examsService.crear(body.tipo, body.mascotaId);
  }

  @Get('mascota/:mascotaId')
  async listarPorMascota(
    @Req() req: RequestConUsuario,
    @Param('mascotaId') mascotaId: string,
  ) {
    if (req.user.rol !== 'ADMIN') {
      const examenes = await this.examsService.listarPorMascota(mascotaId);
      const ajeno = examenes.some((e) => e.mascota.tutorId !== req.user.userId);
      if (ajeno) {
        throw new ForbiddenException('No tienes acceso a estos exámenes');
      }
      return examenes;
    }
    return this.examsService.listarPorMascota(mascotaId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  listarTodos() {
    return this.examsService.listarTodos();
  }

  @Get(':id')
  async buscarPorId(
    @Req() req: RequestConUsuario,
    @Param('id') id: string,
  ) {
    const examen = await this.examsService.buscarPorId(id);
    if (!examen) throw new NotFoundException('Examen no encontrado');
    if (req.user.rol !== 'ADMIN' && examen.mascota.tutorId !== req.user.userId) {
      throw new ForbiddenException('No tienes acceso a este examen');
    }
    return examen;
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  actualizarEstado(
    @Param('id') id: string,
    @Body() body: ActualizarEstadoExamenDto,
  ) {
    return this.examsService.actualizarEstado(id, body.estado, body.archivoUrl);
  }

  @Post(':id/subir')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }))
  async subirArchivo(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^application\/pdf$/ })
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES })
        .build({ fileIsRequired: true }),
    )
    archivo: Express.Multer.File,
  ) {
    if (!archivo?.buffer || archivo.size === 0) {
      throw new BadRequestException('Archivo vacío');
    }
    return this.examsService.subirArchivo(id, archivo);
  }
}
