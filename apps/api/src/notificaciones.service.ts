import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Paleta de la marca Silvestra Vet.
const COLOR = {
  greenDeep: '#0d2818',
  greenMid: '#1e4030',
  cream: '#f5f1e8',
  paper: '#ffffff',
  ink: '#1a2418',
  inkSoft: '#4a5042',
  inkMute: '#8a8e80',
  rule: '#e3ddcf',
  danger: '#8a3e35',
};

interface PlantillaOpciones {
  titulo: string;
  preheader: string;
  cuerpoHtml: string;
  acento?: 'verde' | 'rojo';
}

/**
 * Envuelve el contenido en el layout HTML de la marca, usando tablas e
 * inline styles para compatibilidad máxima con clientes de correo.
 */
function plantilla({ titulo, preheader, cuerpoHtml, acento = 'verde' }: PlantillaOpciones): string {
  const acentoColor = acento === 'rojo' ? COLOR.danger : COLOR.greenDeep;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(titulo)}</title>
</head>
<body style="margin:0; padding:0; background-color:${COLOR.cream}; -webkit-text-size-adjust:100%;">
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:${COLOR.paper}; border:1px solid ${COLOR.rule}; border-radius:14px; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:${COLOR.greenDeep}; padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Helvetica,Arial,sans-serif; font-size:18px; font-weight:700; letter-spacing:0.04em; color:${COLOR.cream};">
                    SILVESTRA <span style="font-weight:400; font-style:italic; color:rgba(245,241,232,0.8);">vet</span>
                  </td>
                  <td align="right" style="font-family:Helvetica,Arial,sans-serif; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(245,241,232,0.55);">
                    Veterinario a domicilio
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Barra de acento -->
          <tr><td style="height:3px; background-color:${acentoColor}; line-height:3px; font-size:0;">&nbsp;</td></tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px;">
              ${cuerpoHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${COLOR.cream}; padding:20px 32px; border-top:1px solid ${COLOR.rule};">
              <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:11px; line-height:1.6; color:${COLOR.inkMute};">
                Silvestra Vet · Valparaíso, Chile<br>
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(texto: string): string {
  return `<h1 style="margin:0 0 14px; font-family:Helvetica,Arial,sans-serif; font-size:22px; font-weight:600; line-height:1.25; color:${COLOR.ink};">${texto}</h1>`;
}

function parrafo(texto: string): string {
  return `<p style="margin:0 0 16px; font-family:Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:${COLOR.inkSoft};">${texto}</p>`;
}

function detalleFila(label: string, valor: string): string {
  return `<tr>
    <td style="padding:8px 0; font-family:Helvetica,Arial,sans-serif; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:${COLOR.inkMute}; vertical-align:top; white-space:nowrap; padding-right:16px;">${label}</td>
    <td style="padding:8px 0; font-family:Helvetica,Arial,sans-serif; font-size:15px; color:${COLOR.ink};">${valor}</td>
  </tr>`;
}

function tablaDetalles(filas: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; border-top:1px solid ${COLOR.rule}; border-bottom:1px solid ${COLOR.rule};">${filas}</table>`;
}

function boton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr><td style="border-radius:999px; background-color:${COLOR.greenDeep};">
      <a href="${url}" style="display:inline-block; padding:13px 28px; font-family:Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; color:${COLOR.cream}; text-decoration:none; border-radius:999px;">${texto}</a>
    </td></tr>
  </table>`;
}

function nota(texto: string): string {
  return `<p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:1.5; color:${COLOR.inkMute};">${texto}</p>`;
}

@Injectable()
export class NotificacionesService implements OnModuleInit {
  private readonly logger = new Logger(NotificacionesService.name);
  private transporter!: Transporter;

  onModuleInit() {
    // El orden de resolución DNS se fuerza a IPv4 en main.ts (Render no tiene
    // conectividad IPv6 saliente). Dejamos también family: 4 a nivel de socket.
    const opciones: SMTPTransport.Options & { family?: number } = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      family: 4,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
    this.transporter = nodemailer.createTransport(opciones);
  }

  private get from(): string {
    return process.env.SMTP_FROM ?? 'Silvestra Vet <notificaciones.silvestra@gmail.com>';
  }

  private async enviar(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  private formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  async notificarExamenDisponible(
    email: string,
    nombreMascota: string,
    archivoUrl: string,
  ): Promise<void> {
    const nombre = escapeHtml(nombreMascota);
    const url = escapeHtml(archivoUrl);
    const titulo = `Silvestra Vet · El examen de ${nombre} ya está disponible`;
    const html = plantilla({
      titulo,
      preheader: `Ya puedes ver el examen de ${nombre}.`,
      cuerpoHtml:
        heading(`Examen de ${nombre} disponible`) +
        parrafo(`Los resultados del examen de <strong>${nombre}</strong> ya están listos para que los revises.`) +
        boton('Ver examen', url) +
        nota('Por seguridad, este enlace expira en 24 horas. Si caduca, contáctanos para generar uno nuevo.'),
    });
    try {
      await this.enviar(email, titulo, html);
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
    const serviciosStr = servicios.map(escapeHtml).join(', ') || '—';
    const dir = escapeHtml(direccion);
    const titulo = `Silvestra Vet · Recibimos tu solicitud de cita para ${nombre}`;
    const html = plantilla({
      titulo,
      preheader: `Tu cita para ${nombre} quedó registrada. Te avisaremos al confirmarse.`,
      cuerpoHtml:
        heading(`Cita registrada`) +
        parrafo(`La cita para <strong>${nombre}</strong> quedó registrada. Pronto la confirmaremos y te avisaremos por este medio.`) +
        tablaDetalles(
          detalleFila('Mascota', nombre) +
          detalleFila('Fecha', `${this.formatearFecha(fecha)}`) +
          detalleFila('Hora', `${this.formatearHora(fecha)}`) +
          detalleFila('Servicios', serviciosStr) +
          detalleFila('Dirección', dir),
        ) +
        nota('Si necesitas modificar o cancelar la cita, puedes hacerlo desde tu panel.'),
    });
    try {
      await this.enviar(email, titulo, html);
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
    const fechaStr = this.formatearFecha(fecha);
    const horaStr = this.formatearHora(fecha);
    const esConfirmada = estado === 'CONFIRMADA';
    const titulo = esConfirmada
      ? `Silvestra Vet · Cita confirmada para ${nombre} — ${fechaStr}, ${horaStr}`
      : `Silvestra Vet · Cita cancelada para ${nombre}`;
    const html = plantilla({
      titulo,
      preheader: esConfirmada
        ? `Confirmamos la visita a domicilio para ${nombre}.`
        : `La cita para ${nombre} fue cancelada.`,
      acento: esConfirmada ? 'verde' : 'rojo',
      cuerpoHtml: esConfirmada
        ? heading(`Cita confirmada`) +
          parrafo(`Confirmamos la visita a domicilio para <strong>${nombre}</strong>.`) +
          tablaDetalles(
            detalleFila('Mascota', nombre) +
            detalleFila('Fecha', fechaStr) +
            detalleFila('Hora', horaStr),
          ) +
          parrafo('Nuestro equipo llegará a la dirección indicada en el horario acordado. Procura tener a tu mascota disponible y un espacio tranquilo para la atención.')
        : heading(`Cita cancelada`) +
          parrafo(`La cita para <strong>${nombre}</strong> del <strong>${fechaStr}</strong> ha sido cancelada.`) +
          nota('Si quieres reagendar, puedes hacerlo desde tu panel o contactarnos directamente.'),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(`No se pudo enviar estado de cita a ${email}: ${String(err)}`);
    }
  }
}
