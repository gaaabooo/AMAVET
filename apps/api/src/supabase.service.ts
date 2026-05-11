import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;

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

  async subirArchivo(buffer: Buffer, nombreArchivo: string, mimeType: string) {
    if (mimeType !== 'application/pdf') {
      throw new InternalServerErrorException('Tipo de archivo no permitido');
    }

    const { error } = await this.client.storage
      .from('Examenes')
      .upload(nombreArchivo, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw new InternalServerErrorException(`Error al subir archivo: ${error.message}`);

    const { data: urlData } = this.client.storage.from('Examenes').getPublicUrl(nombreArchivo);
    return urlData.publicUrl;
  }
}
