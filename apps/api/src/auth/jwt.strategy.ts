import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
  tv?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está definido');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: 'amavet-api',
      // Solo se acepta HMAC-SHA256, el algoritmo con el que se firman los
      // tokens. Fijarlo explícitamente evita que un token firmado con otro
      // algoritmo sea aceptado.
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    // El claim "tv" debe coincidir con el tokenVersion actual del usuario. Si la
    // contraseña se cambió después de emitir este token, tokenVersion en la BD
    // será mayor y el token queda invalidado. También se rechaza si el usuario
    // ya no existe o si su cuenta está marcada para eliminación.
    const estado = await this.usersService.obtenerEstadoSesion(payload.sub);
    if (estado === null) {
      throw new UnauthorizedException('La cuenta ya no existe');
    }
    if (estado.eliminado) {
      throw new UnauthorizedException('La cuenta está eliminada');
    }
    if ((payload.tv ?? 0) !== estado.tokenVersion) {
      throw new UnauthorizedException('Sesión expirada, vuelve a iniciar sesión');
    }
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}
