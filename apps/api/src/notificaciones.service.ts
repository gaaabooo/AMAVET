import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificacionesService {
  async notificarExamenDisponible(
    email: string,
    nombreMascota: string,
    archivoUrl: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: `Examen disponible para ${nombreMascota}`,
      html: `<p>El examen de <strong>${nombreMascota}</strong> ya está disponible.</p><p><a href="${archivoUrl}">Ver examen</a></p>`,
    });
  }
}
