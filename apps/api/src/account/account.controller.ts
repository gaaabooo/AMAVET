import {
  Controller,
  Delete,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { AccountService } from './account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestConUsuario {
  user: { userId: string; email: string; rol: 'TUTOR' | 'ADMIN' };
}

// Longitud mínima exigida a PURGE_SECRET. Un secreto corto sería adivinable por
// fuerza bruta; por debajo de este umbral el endpoint de purga queda cerrado.
const PURGE_SECRET_MIN_LEN = 24;

// Compara dos secretos en tiempo constante (evita timing attacks).
function secretoCoincide(recibido: string, esperado: string): boolean {
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

@Controller('cuenta')
export class AccountController {
  constructor(private accountService: AccountService) {}

  /**
   * Un usuario elimina su propia cuenta. Soft-delete: queda recuperable durante
   * el periodo de gracia iniciando sesión de nuevo.
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminarPropia(@Req() req: RequestConUsuario) {
    // Un ADMIN no puede eliminar su propia cuenta si es el único: dejaría al
    // sistema sin administrador.
    if (await this.accountService.esUnicoAdminActivo(req.user.userId)) {
      throw new ForbiddenException(
        'Eres el único administrador. Asigna otro administrador antes de eliminar tu cuenta.',
      );
    }
    return this.accountService.eliminarCuenta(req.user.userId);
  }

  /**
   * Un ADMIN elimina la cuenta de otro usuario. No puede eliminar cuentas de
   * otros administradores ni usar esta ruta para eliminarse a sí mismo.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async eliminarComoAdmin(
    @Req() req: RequestConUsuario,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    if (req.user.rol !== 'ADMIN') {
      throw new ForbiddenException('Solo un administrador puede eliminar otras cuentas');
    }
    if (id === req.user.userId) {
      throw new ForbiddenException(
        'Para eliminar tu propia cuenta usa la opción de tu panel de configuración.',
      );
    }
    // Un admin no puede eliminar la cuenta de otro admin por esta vía.
    const rolObjetivo = await this.accountService.obtenerRol(id);
    if (rolObjetivo === 'ADMIN') {
      throw new ForbiddenException('No puedes eliminar la cuenta de otro administrador');
    }
    return this.accountService.eliminarCuenta(id);
  }

  /**
   * Purga las cuentas con periodo de gracia vencido. Lo invoca un cron externo
   * (cron-job.org, GitHub Actions) que envía el secreto compartido en la
   * cabecera X-Purge-Secret. No usa JWT porque no hay un usuario detrás.
   */
  @Post('purgar')
  @HttpCode(HttpStatus.OK)
  purgar(@Headers('x-purge-secret') secreto?: string) {
    const esperado = process.env.PURGE_SECRET;
    // Sin secreto configurado, o con uno demasiado corto para ser seguro, el
    // endpoint queda cerrado: nunca se ejecuta.
    if (!esperado || esperado.length < PURGE_SECRET_MIN_LEN) {
      throw new UnauthorizedException('Purga no habilitada');
    }
    if (!secreto || !secretoCoincide(secreto, esperado)) {
      throw new UnauthorizedException('Secreto de purga inválido');
    }
    return this.accountService.purgarCuentasVencidas();
  }
}
