import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

@Injectable()
export class NotificacionesService implements OnModuleInit {
  private transporter!: Transporter;

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async notificarExamenDisponible(
    email: string,
    nombreMascota: string,
    archivoUrl: string,
  ): Promise<void> {
    const safeName = escapeHtml(nombreMascota);
    const safeUrl = escapeHtml(archivoUrl);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'AMAVET <notificaciones@amavet.cl>',
      to: email,
      subject: `Examen disponible para ${safeName}`,
      html: `<p>El examen de <strong>${safeName}</strong> ya está disponible.</p><p><a href="${safeUrl}">Ver examen</a></p>`,
    });
  }
}
