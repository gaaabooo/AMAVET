import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import { emailEnmascarado } from './common/audit';

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
function plantilla({
  titulo,
  preheader,
  cuerpoHtml,
  acento = 'verde',
}: PlantillaOpciones): string {
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

// Parsea "Nombre <email@dominio>" → { name, email }. Si no trae nombre, usa solo el email.
export function parseRemitente(valor: string): { name: string; email: string } {
  const m = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(valor);
  if (m) return { name: m[1] || 'Silvestra Vet', email: m[2] };
  return { name: 'Silvestra Vet', email: valor.trim() };
}

@Injectable()
export class NotificacionesService implements OnModuleInit {
  private readonly logger = new Logger(NotificacionesService.name);

  onModuleInit() {
    // Usamos la API HTTP de SendGrid (puerto 443) en lugar de SMTP, porque el
    // hosting (Render free) bloquea el SMTP saliente (puertos 465/587).
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'SENDGRID_API_KEY no configurada; los emails no se enviarán.',
      );
      return;
    }
    sgMail.setApiKey(apiKey);
  }

  private get from(): { name: string; email: string } {
    // El "from" debe ser un sender verificado en SendGrid (single sender o
    // dominio verificado). Cuando haya dominio propio, usar noreply@tu-dominio.
    return parseRemitente(
      process.env.SENDGRID_FROM ??
        'Silvestra Vet <notificaciones.silvestra@gmail.com>',
    );
  }

  private async enviar(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    await sgMail.send({ from: this.from, to, subject, html });
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatearHora(fecha: Date): string {
    return fecha.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async notificarExamenDisponible(
    email: string,
    nombreMascota: string,
    archivoUrl: string,
  ): Promise<void> {
    const nombre = escapeHtml(nombreMascota);
    const url = escapeHtml(archivoUrl);
    // El asunto es texto plano, no HTML: usa el nombre sin escapar para no
    // mostrar entidades como "&amp;".
    const titulo = `Silvestra Vet · El examen de ${nombreMascota} ya está disponible`;
    const html = plantilla({
      titulo,
      preheader: `Ya puedes ver el examen de ${nombre}.`,
      cuerpoHtml:
        heading(`Examen de ${nombre} disponible`) +
        parrafo(
          `Los resultados del examen de <strong>${nombre}</strong> ya están listos para que los revises.`,
        ) +
        boton('Ver examen', url) +
        nota(
          'Por seguridad, este enlace expira en 24 horas. Si caduca, contáctanos para generar uno nuevo.',
        ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar notificación de examen a ${emailEnmascarado(email)}: ${String(err)}`,
      );
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
    // Asunto en texto plano: nombre sin escapar.
    const titulo = `Silvestra Vet · Recibimos tu solicitud de cita para ${nombreMascota}`;
    const html = plantilla({
      titulo,
      preheader: `Tu cita para ${nombre} quedó registrada. Te avisaremos al confirmarse.`,
      cuerpoHtml:
        heading(`Cita registrada`) +
        parrafo(
          `La cita para <strong>${nombre}</strong> quedó registrada. Pronto la confirmaremos y te avisaremos por este medio.`,
        ) +
        tablaDetalles(
          detalleFila('Mascota', nombre) +
            detalleFila('Fecha', `${this.formatearFecha(fecha)}`) +
            detalleFila('Hora', `${this.formatearHora(fecha)}`) +
            detalleFila('Servicios', serviciosStr) +
            detalleFila('Dirección', dir),
        ) +
        nota(
          'Si necesitas modificar o cancelar la cita, puedes hacerlo desde tu panel.',
        ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar notificación de cita a ${emailEnmascarado(email)}: ${String(err)}`,
      );
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
    // Asunto en texto plano: nombre sin escapar.
    const titulo = esConfirmada
      ? `Silvestra Vet · Cita confirmada para ${nombreMascota} — ${fechaStr}, ${horaStr}`
      : `Silvestra Vet · Cita cancelada para ${nombreMascota}`;
    const html = plantilla({
      titulo,
      preheader: esConfirmada
        ? `Confirmamos la visita a domicilio para ${nombre}.`
        : `La cita para ${nombre} fue cancelada.`,
      acento: esConfirmada ? 'verde' : 'rojo',
      cuerpoHtml: esConfirmada
        ? heading(`Cita confirmada`) +
          parrafo(
            `Confirmamos la visita a domicilio para <strong>${nombre}</strong>.`,
          ) +
          tablaDetalles(
            detalleFila('Mascota', nombre) +
              detalleFila('Fecha', fechaStr) +
              detalleFila('Hora', horaStr),
          ) +
          parrafo(
            'Nuestro equipo llegará a la dirección indicada en el horario acordado. Procura tener a tu mascota disponible y un espacio tranquilo para la atención.',
          )
        : heading(`Cita cancelada`) +
          parrafo(
            `La cita para <strong>${nombre}</strong> del <strong>${fechaStr}</strong> ha sido cancelada.`,
          ) +
          nota(
            'Si quieres reagendar, puedes hacerlo desde tu panel o contactarnos directamente.',
          ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar estado de cita a ${emailEnmascarado(email)}: ${String(err)}`,
      );
    }
  }

  // Email con el enlace para restablecer la contraseña. El enlace lleva un
  // token de un solo uso que caduca en 15 minutos.
  async notificarResetPassword(email: string, urlReset: string): Promise<void> {
    const url = escapeHtml(urlReset);
    const titulo = 'Silvestra Vet · Recupera tu contraseña';
    const html = plantilla({
      titulo,
      preheader: 'Restablece tu contraseña con el enlace de este correo.',
      cuerpoHtml:
        heading('Recupera tu contraseña') +
        parrafo(
          'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una contraseña nueva.',
        ) +
        boton('Restablecer contraseña', url) +
        nota(
          'Este enlace expira en 15 minutos y solo puede usarse una vez. Si no solicitaste este cambio, ignora este correo: tu contraseña actual seguirá siendo válida.',
        ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar email de reset a ${emailEnmascarado(email)}: ${String(err)}`,
      );
    }
  }

  // Email de aviso enviado a cuentas que ingresan con Google cuando alguien
  // pide recuperar su contraseña: no tienen contraseña que restablecer.
  async notificarResetCuentaGoogle(email: string): Promise<void> {
    const titulo = 'Silvestra Vet · Tu cuenta usa acceso con Google';
    const html = plantilla({
      titulo,
      preheader:
        'Tu cuenta ingresa con Google; no tiene contraseña que restablecer.',
      cuerpoHtml:
        heading('Tu cuenta usa Google') +
        parrafo(
          'Recibimos una solicitud para restablecer tu contraseña, pero tu cuenta de Silvestra Vet ingresa con Google. No tiene una contraseña que cambiar.',
        ) +
        parrafo(
          'Para entrar, usa el botón <strong>Continuar con Google</strong> en la página de inicio de sesión.',
        ) +
        nota(
          'Si no solicitaste esto, puedes ignorar este correo con tranquilidad.',
        ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar aviso de cuenta Google a ${emailEnmascarado(email)}: ${String(err)}`,
      );
    }
  }

  // Confirmación tras un cambio de contraseña exitoso (por reset o manual).
  async notificarPasswordCambiada(email: string): Promise<void> {
    const titulo = 'Silvestra Vet · Tu contraseña fue cambiada';
    const html = plantilla({
      titulo,
      preheader: 'Confirmamos el cambio de contraseña de tu cuenta.',
      acento: 'rojo',
      cuerpoHtml:
        heading('Tu contraseña fue cambiada') +
        parrafo(
          'Te confirmamos que la contraseña de tu cuenta de Silvestra Vet se cambió correctamente. Por seguridad, se cerraron todas las sesiones abiertas.',
        ) +
        nota(
          'Si no fuiste tú quien hizo este cambio, contacta a soporte de inmediato: tu cuenta podría estar comprometida.',
        ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar confirmación de cambio de password a ${emailEnmascarado(email)}: ${String(err)}`,
      );
    }
  }

  // Confirmación de que la cuenta quedó marcada para eliminación, con el plazo
  // de gracia durante el cual aún puede recuperarse iniciando sesión.
  async notificarCuentaEliminada(email: string, diasGracia: number): Promise<void> {
    const titulo = 'Silvestra Vet · Tu cuenta será eliminada';
    const html = plantilla({
      titulo,
      preheader: `Tu cuenta se eliminará en ${diasGracia} días. Aún puedes recuperarla.`,
      acento: 'rojo',
      cuerpoHtml:
        heading('Tu cuenta será eliminada') +
        parrafo(
          `Recibimos tu solicitud para eliminar tu cuenta de Silvestra Vet. Tus datos se conservarán durante <strong>${diasGracia} días</strong> y luego se borrarán de forma definitiva.`,
        ) +
        parrafo(
          'Si cambias de opinión dentro de ese plazo, solo vuelve a iniciar sesión con tu correo y contraseña y tu cuenta se reactivará automáticamente.',
        ) +
        nota(
          'Si no solicitaste esto, inicia sesión cuanto antes para reactivar tu cuenta y cambia tu contraseña.',
        ),
    });
    try {
      await this.enviar(email, titulo, html);
    } catch (err) {
      this.logger.warn(
        `No se pudo enviar aviso de cuenta eliminada a ${emailEnmascarado(email)}: ${String(err)}`,
      );
    }
  }

  // Alerta de seguridad al administrador (fuerza bruta, login admin desde IP
  // nueva, etc.). El destino es ADMIN_ALERT_EMAIL; si no está configurado, la
  // alerta solo queda en el log y en el audit trail.
  // Devuelve true si el correo se envió, false si no (sin destino o fallo) —
  // así quien llama puede decidir si marca el cooldown.
  async notificarAlertaSeguridad(titulo: string, detalle: string): Promise<boolean> {
    const destino = process.env.ADMIN_ALERT_EMAIL;
    if (!destino) {
      this.logger.warn(
        'ADMIN_ALERT_EMAIL no configurada: la alerta de seguridad no se envió por correo.',
      );
      return false;
    }
    const asunto = `Silvestra Vet · Alerta de seguridad — ${titulo}`;
    const html = plantilla({
      titulo: asunto,
      preheader: detalle,
      acento: 'rojo',
      cuerpoHtml:
        heading('Alerta de seguridad') +
        parrafo(escapeHtml(detalle)) +
        nota(
          'Revisa el panel de auditoría para más detalle. Si confirmas actividad maliciosa, cambia las credenciales afectadas.',
        ),
    });
    try {
      await this.enviar(destino, asunto, html);
      return true;
    } catch (err) {
      this.logger.warn(`No se pudo enviar la alerta de seguridad: ${String(err)}`);
      return false;
    }
  }
}
