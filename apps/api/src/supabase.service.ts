import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );
  }

  async subirArchivo(buffer: Buffer, nombreArchivo: string, mimeType: string) {
    const { data, error } = await this.client.storage
      .from('Examenes')
      .upload(nombreArchivo, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = this.client.storage
      .from('Examenes')
      .getPublicUrl(nombreArchivo);

    return urlData.publicUrl;
  }
}