import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
  private readonly logger = new Logger(NotificacionesService.name);
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

  private get from(): string {
    return process.env.SMTP_FROM ?? 'AMAVET <notificaciones@amavet.cl>';
  }

  private async enviar(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  async notificarExamenDisponible(
    email: string,
    nombreMascota: string,
    archivoUrl: string,
  ): Promise<void> {
    const nombre = escapeHtml(nombreMascota);
    const url = escapeHtml(archivoUrl);
    try {
      await this.enviar(
        email,
        `Examen disponible para ${nombre}`,
        `<p>El examen de <strong>${nombre}</strong> ya está disponible.</p>
         <p><a href="${url}">Ver examen</a></p>
         <p style="color:#666;font-size:12px;">El enlace expira en 24 horas.</p>`,
      );
    } catch (err) {
      this.logger.warn(`No se pudo enviar notificación de examen a ${email}: ${String(err)}`);
    }
  }

  async notificarCitaAgendada(
    email: string,
    nombreMascota: string,
    fecha: Date,
    servicios: string[],
    direccion: string,
  ): Promise<void> {
    const nombre = escapeHtml(nombreMascota);
    const fechaStr = fecha.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const serviciosStr = servicios.map(escapeHtml).join(', ');
    const dir = escapeHtml(direccion);
    try {
      await this.enviar(
        email,
        `Cita agendada para ${nombre}`,
        `<p>Tu cita para <strong>${nombre}</strong> ha sido registrada correctamente.</p>
         <ul>
           <li><strong>Fecha:</strong> ${fechaStr} a las ${horaStr}</li>
           <li><strong>Servicios:</strong> ${serviciosStr}</li>
           <li><strong>Dirección:</strong> ${dir}</li>
         </ul>
         <p>Te notificaremos cuando sea confirmada.</p>`,
      );
    } catch (err) {
      this.logger.warn(`No se pudo enviar notificación de cita a ${email}: ${String(err)}`);
    }
  }

  async notificarEstadoCita(
    email: string,
    nombreMascota: string,
    fecha: Date,
    estado: 'CONFIRMADA' | 'CANCELADA',
  ): Promise<void> {
    const nombre = escapeHtml(nombreMascota);
    const fechaStr = fecha.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const esConfirmada = estado === 'CONFIRMADA';
    try {
      await this.enviar(
        email,
        `Cita ${esConfirmada ? 'confirmada' : 'cancelada'} — ${nombre}`,
        `<p>La cita del <strong>${fechaStr}</strong> para <strong>${nombre}</strong> ha sido
         <strong>${esConfirmada ? 'confirmada' : 'cancelada'}</strong>.</p>
         ${esConfirmada
           ? '<p>Por favor preséntate con anticipación en la dirección indicada.</p>'
           : '<p>Si tienes dudas, contáctanos para reagendar.</p>'
         }`,
      );
    } catch (err) {
      this.logger.warn(`No se pudo enviar estado de cita a ${email}: ${String(err)}`);
    }
  }
}
