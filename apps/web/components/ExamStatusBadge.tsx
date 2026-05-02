'use client';

interface Props { estado: 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE' }

const config: Record<Props['estado'], { clases: string; label: string }> = {
  PENDIENTE:  { clases: 'bg-(--secondary-container) text-(--on-surface)',          label: 'Pendiente'  },
  EN_PROCESO: { clases: 'bg-(--surface-container-high) text-(--on-surface-variant)', label: 'En Proceso' },
  DISPONIBLE: { clases: 'bg-(--tertiary-fixed) text-(--on-surface)',                label: 'Disponible' },
};

export default function ExamStatusBadge({ estado }: Props) {
  const { clases, label } = config[estado];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${clases}`}>{label}</span>;
}
