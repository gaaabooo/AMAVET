import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificacionesService } from '../notificaciones.service';
import { serviciosQueGeneranExamen } from './servicios';
import { EstadoCita } from '@prisma/client';

// Estados que cuentan como "activos" (la cita aún ocupa agenda).
const ESTADOS_ACTIVOS: EstadoCita[] = ['PENDIENTE', 'CONFIRMADA'];

// Margen alrededor de la hora de una cita. AMAVET es veterinario a domicilio:
// el equipo necesita tiempo de traslado, así que dos citas a menos de este
// margen una de otra no se pueden cumplir.
const MARGEN_SLOT_MS = 60 * 60 * 1000; // 1 hora

// Tope de citas activas (PENDIENTE + CONFIRMADA) que un tutor puede tener a la
// vez. Evita que una cuenta llene la agenda de forma abusiva.
const MAX_CITAS_ACTIVAS_POR_TUTOR = 10;

// Cuánto se puede agendar hacia el futuro. Una cita a años vista es siempre
// un error o un abuso.
const MAX_DIAS_FUTURO = 180;

@Injectable()
export class CitasService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  async crear(
    fecha: string,
    direccion: string,
    servicios: string[],
    mascotaId: string,
  ) {
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime()))
      throw new BadRequestException('Fecha inválida');
    const ahora = new Date();
    if (fechaDate < ahora)
      throw new BadRequestException('No puedes agendar en el pasado');

    const limiteFuturo = new Date(
      ahora.getTime() + MAX_DIAS_FUTURO * 24 * 60 * 60 * 1000,
    );
    if (fechaDate > limiteFuturo) {
      throw new BadRequestException(
        `No puedes agendar con más de ${MAX_DIAS_FUTURO} días de anticipación`,
      );
    }

    const mascota = await this.prisma.mascota.findUnique({
      where: { id: mascotaId },
      include: { tutor: true },
    });
    if (!mascota) throw new NotFoundException('Mascota no encontrada');

    // La verificación de límites y la creación van en una transacción
    // Serializable para evitar la race de dos solicitudes simultáneas:
    // bajo READ COMMITTED (default de PostgreSQL) dos transacciones podrían
    // leer "no hay solapamiento" y crear ambas la cita. Con Serializable
    // PostgreSQL aborta una con el código 40001 (Prisma lo traduce a P2034);
    // reintentamos una sola vez, y en la segunda corrida el findFirst ya
    // verá la cita creada por la otra transacción y se lanzará el
    // BadRequestException de slot ocupado, que es exactamente lo deseado.
    const cita = await this.crearConSerializable(
      fechaDate,
      direccion,
      servicios,
      mascotaId,
      mascota.tutorId,
    );

    // Fire-and-forget: el envío del email no debe bloquear ni demorar la
    // respuesta. notificarCitaAgendada ya maneja sus propios errores.
    void this.notificaciones.notificarCitaAgendada(
      mascota.tutor.email,
      mascota.nombre,
      fechaDate,
      servicios,
      direccion,
    );

    return cita;
  }

  async listarTodas() {
    return this.prisma.cita.findMany({
      include: { mascota: { include: { tutor: true } } },
      orderBy: { fecha: 'asc' },
      take: 500,
    });
  }

  async listarPorMascota(mascotaId: string) {
    return this.prisma.cita.findMany({
      where: { mascotaId },
      orderBy: { fecha: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.cita.findUnique({
      where: { id },
      include: { mascota: true },
    });
  }

  async actualizarEstado(id: string, estado: EstadoCita) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: { mascota: { include: { tutor: true } } },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    // D-4: COMPLETADA y CANCELADA son estados terminales: una vez ahí, la cita
    // no vuelve atrás. Evita reabrir citas ya cerradas (p. ej. CANCELADA ->
    // CONFIRMADA o COMPLETADA -> PENDIENTE).
    if (cita.estado === 'COMPLETADA' || cita.estado === 'CANCELADA') {
      throw new BadRequestException(
        `La cita ya está ${cita.estado.toLowerCase()} y no puede cambiar de estado`,
      );
    }

    const resultado = await this.prisma.cita.update({
      where: { id },
      data: { estado },
    });

    if (estado === 'CONFIRMADA' || estado === 'CANCELADA') {
      // Fire-and-forget: no bloquear la respuesta esperando el email.
      void this.notificaciones.notificarEstadoCita(
        cita.mascota.tutor.email,
        cita.mascota.nombre,
        cita.fecha,
        estado,
      );
    }

    return resultado;
  }

  async esDuenoDeMascota(mascotaId: string, userId: string): Promise<boolean> {
    const mascota = await this.prisma.mascota.findUnique({
      where: { id: mascotaId },
      select: { tutorId: true },
    });
    return mascota?.tutorId === userId;
  }

  // Ejecuta el bloque "verificar límites + crear cita" en una transacción con
  // aislamiento Serializable. Ver comentario en crear() sobre la race que
  // esto cierra. Reintenta una sola vez si PostgreSQL aborta la transacción
  // por conflicto de serialización (P2034 en Prisma, 40001 en pg). En tu
  // volumen de tráfico el reintento prácticamente nunca se dispara; está como
  // defensa en profundidad.
  private async crearConSerializable(
    fechaDate: Date,
    direccion: string,
    servicios: string[],
    mascotaId: string,
    tutorId: string,
  ) {
    for (let intento = 0; intento < 2; intento++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // D-2: tope de citas activas por tutor.
            const citasActivas = await tx.cita.count({
              where: {
                estado: { in: ESTADOS_ACTIVOS },
                mascota: { tutorId },
              },
            });
            if (citasActivas >= MAX_CITAS_ACTIVAS_POR_TUTOR) {
              throw new BadRequestException(
                `Alcanzaste el máximo de ${MAX_CITAS_ACTIVAS_POR_TUTOR} citas activas. Espera a que se completen o cancela alguna.`,
              );
            }

            // D-1: no permitir doble-booking. Una cita activa dentro del margen
            // de traslado bloquea el slot (agenda compartida del equipo).
            const desde = new Date(fechaDate.getTime() - MARGEN_SLOT_MS);
            const hasta = new Date(fechaDate.getTime() + MARGEN_SLOT_MS);
            const solapada = await tx.cita.findFirst({
              where: {
                estado: { in: ESTADOS_ACTIVOS },
                fecha: { gt: desde, lt: hasta },
              },
              select: { id: true },
            });
            if (solapada) {
              throw new BadRequestException(
                'Ya hay una cita agendada en ese horario. Elige otra hora.',
              );
            }

            const citaCreada = await tx.cita.create({
              data: { fecha: fechaDate, direccion, servicios, mascotaId },
              include: { mascota: { include: { tutor: true } } },
            });

            // Cada servicio de laboratorio o test rápido genera un examen
            // PENDIENTE ligado a esta cita. El admin solo subirá el PDF
            // después; nunca crea exámenes a mano, así no pueden duplicarse
            // dentro de la misma cita.
            const tiposExamen = serviciosQueGeneranExamen(servicios);
            if (tiposExamen.length > 0) {
              await tx.examen.createMany({
                data: tiposExamen.map((tipo) => ({
                  tipo,
                  mascotaId,
                  citaId: citaCreada.id,
                })),
              });
            }

            return citaCreada;
          },
          { isolationLevel: 'Serializable' },
        );
      } catch (err) {
        const codigo = (err as { code?: string }).code;
        // P2034 = Prisma transaction failed due to write conflict or deadlock
        // (incluye serialization_failure de PostgreSQL). Reintentamos 1 vez.
        if (codigo === 'P2034' && intento === 0) continue;
        throw err;
      }
    }
    // Inalcanzable: el for siempre retorna o lanza dentro del bloque.
    throw new Error('crearConSerializable: estado inalcanzable');
  }
}
