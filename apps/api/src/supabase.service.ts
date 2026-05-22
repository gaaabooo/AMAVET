import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const SIGNED_URL_TTL_SECONDS = 86_400; // 24 horas (coincide con el texto del email)

// El tipo del cliente se infiere de createClient para evitar desajustes entre
// la firma genérica de la librería y un SupabaseClient declarado a mano.
type ClienteSupabase = ReturnType<typeof createClient>;

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client!: ClienteSupabase;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_KEY son obligatorios');
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async subirArchivo(
    buffer: Buffer,
    nombreArchivo: string,
    mimeType: string,
  ): Promise<string> {
    if (mimeType !== 'application/pdf') {
      throw new InternalServerErrorException('Tipo de archivo no permitido');
    }

    const { error } = await this.client.storage
      .from('Examenes')
      .upload(nombreArchivo, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      // El detalle del SDK (nombres de bucket, rutas internas) solo va al log
      // del servidor; al cliente se le devuelve un mensaje genérico.
      this.logger.error(`Error al subir archivo a Storage: ${error.message}`);
      throw new InternalServerErrorException('No se pudo subir el archivo');
    }

    // Devolvemos la ruta del archivo, NO una URL pública.
    // Las URLs se generan bajo demanda con createSignedUrl().
    return nombreArchivo;
  }

  /**
   * Borra un archivo del bucket. Se usa para compensar (rollback) cuando una
   * operación multi-paso falla después de haber subido el archivo. No lanza:
   * si el borrado falla, solo se registra — el archivo huérfano es un problema
   * menor frente a propagar el error original de la operación.
   */
  async borrarArchivo(rutaArchivo: string): Promise<void> {
    const { error } = await this.client.storage
      .from('Examenes')
      .remove([rutaArchivo]);
    if (error) {
      this.logger.error(
        `No se pudo borrar el archivo huérfano ${rutaArchivo}: ${error.message}`,
      );
    }
  }

  async generarUrlFirmada(rutaArchivo: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from('Examenes')
      .createSignedUrl(rutaArchivo, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        'No se pudo generar la URL del archivo',
      );
    }

    return data.signedUrl;
  }

  async verificarTokenAcceso(
    accessToken: string,
  ): Promise<{ email: string; nombre: string } | null> {
    try {
      const { data, error } = await this.client.auth.getUser(accessToken);
      if (error || !data.user?.email) return null;
      const email = data.user.email;
      const nombre =
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        email.split('@')[0];
      return { email, nombre };
    } catch (err) {
      // Cualquier fallo al validar (red, cliente, etc.) se trata como token inválido.
      // No incluimos el token en el log para no filtrarlo.
      this.logger.warn(`Fallo al verificar token de acceso: ${String(err)}`);
      return null;
    }
  }
}
