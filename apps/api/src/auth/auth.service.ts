import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async registro(nombre: string, email: string, telefono: string, password: string) {
    const existe = await this.usersService.buscarPorEmail(email);
    if (existe) throw new ConflictException('El email ya está registrado');

    const usuario = await this.usersService.crear(nombre, email, telefono, password);
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async loginConGoogle(accessToken: string) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new UnauthorizedException('Configuración de Supabase incompleta');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user?.email) throw new UnauthorizedException('Token de Google inválido');

    const email = data.user.email;
    const nombre = data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? email.split('@')[0];

    const usuario = await this.usersService.buscarOCrearGoogle(email, nombre);

    if (usuario.rol !== 'TUTOR') throw new UnauthorizedException('Solo tutores pueden ingresar con Google');

    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return { token, usuario };
  }

  async login(email: string, password: string) {
    const usuario = await this.usersService.buscarPorEmail(email);

    // Defensa contra timing attacks: si el usuario no existe, hacemos un compare
    // dummy para que la latencia sea similar al caso "usuario existe pero pwd mala".
    if (!usuario) {
      await bcrypt.compare(password, '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsaltinv');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Defensa contra hashes vacíos o corruptos en BD.
    if (!usuario.password || usuario.password.length < 60) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}
