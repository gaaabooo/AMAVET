'use client';

type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';

function texto(estado: EstadoCita) {
  if (estado === 'COMPLETADA') return 'Atendida';
  if (estado === 'CONFIRMADA') return 'Confirmada';
  if (estado === 'CANCELADA')  return 'Cancelada';
  return 'Pendiente';
}

function estilo(estado: EstadoCita) {
  if (estado === 'CONFIRMADA') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'COMPLETADA') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'CANCELADA')  return 'bg-(--error-container) text-(--on-error-container)';
  return 'bg-(--secondary-container) text-(--on-secondary-container)';
}

export default function CitaStatusBadge({ estado }: { estado: EstadoCita }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${estilo(estado)}`}>
      {texto(estado)}
    </span>
  );
}
