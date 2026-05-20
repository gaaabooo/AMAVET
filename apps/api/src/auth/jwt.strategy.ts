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
    });
  }

  async validate(payload: JwtPayload) {
    // El claim "tv" debe coincidir con el tokenVersion actual del usuario. Si la
    // contraseña se cambió después de emitir este token, tokenVersion en la BD
    // será mayor y el token queda invalidado. También rechaza si el usuario fue
    // eliminado.
    const tokenVersionActual = await this.usersService.obtenerTokenVersion(payload.sub);
    if (tokenVersionActual === null) {
      throw new UnauthorizedException('La cuenta ya no existe');
    }
    if ((payload.tv ?? 0) !== tokenVersionActual) {
      throw new UnauthorizedException('Sesión expirada, vuelve a iniciar sesión');
    }
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}
