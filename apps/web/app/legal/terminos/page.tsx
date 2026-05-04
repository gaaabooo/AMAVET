import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Términos de Servicio — Silvestra Vet',
  description:
    'Términos y condiciones que regulan el uso de los servicios veterinarios a domicilio de Silvestra Vet.',
};

export default function TerminosPage() {
  return (
    <LegalLayout
      eyebrow="Documento legal"
      title="Términos de"
      titleItalic="servicio"
      intro="Estos términos regulan el uso de los servicios veterinarios a domicilio prestados por Silvestra Vet. Al agendar una visita o crear una cuenta, aceptas las condiciones descritas a continuación."
      lastUpdated="enero de 2026"
    >
      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        1. Servicio veterinario a domicilio
      </h2>
      <p>
        Silvestra Vet presta atención veterinaria en el domicilio del tutor
        dentro del área de cobertura publicada. Las visitas son realizadas
        por médicos veterinarios titulados, con cédula profesional vigente y
        afiliados al Colegio Médico Veterinario de Chile.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        2. Agendamiento y cancelación
      </h2>
      <p>
        Las visitas se agendan por WhatsApp o desde el panel de la cuenta del
        tutor. Las cancelaciones con menos de 4 horas de anticipación pueden
        estar sujetas a un cargo administrativo, que se informa al momento de
        agendar.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        3. Limitaciones del servicio a domicilio
      </h2>
      <p>
        Algunos procedimientos requieren equipamiento que solo está disponible
        en clínica (cirugías mayores, hospitalización, imagenología avanzada).
        En esos casos, derivamos a clínicas asociadas y coordinamos el
        traslado si el tutor lo solicita.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        4. Resultados clínicos
      </h2>
      <p>
        Los exámenes de laboratorio se procesan en laboratorio veterinario
        externo certificado. Los resultados se entregan en formato PDF a
        través de la cuenta del tutor en un plazo habitual de 24 a 72 horas
        dependiendo del tipo de examen.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        5. Pagos
      </h2>
      <p>
        El pago se realiza al finalizar la visita, mediante transferencia
        bancaria o medios digitales aceptados. Las tarifas se informan al
        momento de agendar y pueden variar según los procedimientos
        efectivamente realizados.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        6. Responsabilidad
      </h2>
      <p>
        Aplicamos los protocolos clínicos vigentes de la medicina veterinaria.
        El tutor es responsable de informar antecedentes médicos relevantes y
        de seguir las indicaciones posteriores a la visita. Silvestra Vet no
        se hace responsable por reacciones derivadas de información incompleta
        o del incumplimiento de las indicaciones entregadas.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        7. Modificaciones
      </h2>
      <p>
        Podemos actualizar estos términos cuando sea necesario. Los cambios
        sustanciales se notifican por correo electrónico antes de su entrada
        en vigencia.
      </p>

      <p
        className="mt-6"
        style={{
          color: '#717973',
          fontStyle: 'italic',
          fontSize: '0.95rem',
        }}
      >
        Este documento es un borrador inicial. Antes de su publicación
        definitiva debe ser revisado por asesoría legal.
      </p>
    </LegalLayout>
  );
}
