import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Política de Privacidad — Silvestra Vet',
  description:
    'Cómo recopilamos, usamos y protegemos los datos personales de los tutores y sus mascotas en Silvestra Vet.',
};

export default function PrivacidadPage() {
  return (
    <LegalLayout
      eyebrow="Documento legal"
      title="Política de"
      titleItalic="privacidad"
      intro="Esta política describe cómo Silvestra Vet recopila, usa y protege la información personal de los tutores que contratan nuestros servicios veterinarios a domicilio."
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
        1. Datos que recopilamos
      </h2>
      <p>
        Para brindar atención veterinaria a domicilio recopilamos información
        del tutor (nombre, correo, teléfono, dirección) y de la mascota
        (especie, raza, edad, antecedentes médicos relevantes). Los resultados
        de exámenes clínicos se almacenan asociados a la cuenta del tutor.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        2. Cómo usamos tus datos
      </h2>
      <p>
        Usamos la información estrictamente para coordinar visitas, entregar
        resultados clínicos y comunicarnos contigo sobre el estado de tu
        mascota. No compartimos tus datos con terceros con fines comerciales.
        Los exámenes que se procesan en laboratorio externo certificado se
        envían bajo acuerdo de confidencialidad.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        3. Almacenamiento y seguridad
      </h2>
      <p>
        Los datos se almacenan cifrados en servidores ubicados en territorio
        chileno o de jurisdicciones con estándares equivalentes. El acceso
        está restringido al personal clínico y administrativo autorizado.
        Aplicamos autenticación con contraseña y, para resultados de exámenes,
        acceso protegido por sesión.
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        4. Tus derechos
      </h2>
      <p>
        Conforme a la Ley 19.628 sobre Protección de la Vida Privada, tienes
        derecho a acceder, rectificar, cancelar y oponerte al tratamiento de
        tus datos personales. Puedes ejercer estos derechos escribiendo a{' '}
        <a
          href="mailto:privacidad@silvestravet.cl"
          className="font-semibold hover:underline underline-offset-4"
          style={{ color: '#012d1d' }}
        >
          privacidad@silvestravet.cl
        </a>
        .
      </p>

      <h2
        className="text-2xl font-semibold mt-4"
        style={{
          color: '#191c1d',
          fontFamily: 'var(--font-manrope)',
          letterSpacing: '-0.01em',
        }}
      >
        5. Cambios a esta política
      </h2>
      <p>
        Si modificamos esta política, publicaremos la versión actualizada en
        esta misma página y, si los cambios son sustanciales, te avisaremos
        por correo electrónico antes de que entren en vigencia.
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
