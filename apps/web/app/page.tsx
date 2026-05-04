import Link from 'next/link';
import Logo from '../components/Logo';

export default function Home() {
  return (
    <main className="w-full relative" style={{ fontFamily: 'var(--font-manrope)' }}>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center"
        style={{ background: 'rgba(248,249,250,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e1e3e4' }}>
        <Logo size="sm" variant="light" />
        <div className="flex gap-3">
          <Link href="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 hover:bg-(--surface)"
            style={{ border: '1px solid #012d1d', color: '#012d1d' }}>
            Iniciar sesión
          </Link>
          <Link href="/registro"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition hover:opacity-90"
            style={{ background: '#012d1d', color: '#ffffff' }}>
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center pt-24 pb-32 overflow-hidden"
        style={{ background: '#f8f9fa' }}>
        <div className="absolute inset-0 z-0">
          <img
            src="/close-up-veterinarian-taking-care-dog.jpg"
            alt="Veterinario con mascota"
            className="w-full h-full object-cover opacity-30"
            style={{ objectPosition: 'center 60%' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f8f9fa 50%, transparent)' }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 w-full relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              style={{ color: '#012d1d' }}>
              <span className="w-8 h-px" style={{ background: '#012d1d', display: 'inline-block' }}></span>
              Atención clínica en tu hogar
            </span>

            <h1 className="text-5xl font-bold leading-tight" style={{ color: '#191c1d', letterSpacing: '-0.02em' }}>
              Veterinario a domicilio,{' '}
              <span style={{ color: '#012d1d', fontStyle: 'italic', fontWeight: 300 }}>
                sin estrés para tu mascota
              </span>
            </h1>

            <p className="text-xl mt-2" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>
              Atención profesional en tu hogar, rápida y confiable.
            </p>

            <div className="inline-flex items-center gap-3 py-2 px-4 rounded-full w-max mt-2"
              style={{ background: '#e7e8e9', border: '1px solid #c1c8c2' }}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#fed65b' }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: '#735c00' }}></span>
              </span>
              <span className="text-sm font-medium" style={{ color: '#191c1d' }}>
                Próxima hora disponible: Mañana, 09:00 AM
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <a href="https://wa.me/56912345678?text=Hola,%20quiero%20agendar%20una%20visita%20veterinaria"
                target="_blank"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ background: '#012d1d', color: '#ffffff', boxShadow: '0 4px 14px rgba(1,45,29,0.39)' }}>
                💬 Agendar por WhatsApp
              </a>
              <Link href="/registro"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold transition-colors duration-150 hover:bg-(--surface)"
                style={{ border: '2px solid #012d1d', color: '#012d1d', background: 'transparent' }}>
                Solicitar visita
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y" style={{ background: '#ffffff', borderColor: '#c1c8c2' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex" style={{ color: '#735c00' }}>
                {'★★★★★'.split('').map((s, i) => <span key={i} className="text-xl">{s}</span>)}
              </div>
              <span className="text-2xl font-bold" style={{ color: '#191c1d' }}>+100 mascotas atendidas</span>
              <span className="text-sm" style={{ color: '#717973' }}>Con calificación perfecta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full md:w-2/3">
              {[
                { texto: '"El doctor fue súper amable, mi perro ni se enteró de la vacuna."', nombre: 'María S.', mascota: 'Dueña de Max', inicial: 'M' },
                { texto: '"Excelente servicio. Revisaron a mi gato en su cama, cero estrés."', nombre: 'Pablo V.', mascota: 'Dueño de Luna', inicial: 'P' },
              ].map((t) => (
                <div key={t.nombre} className="p-6 rounded-xl border" style={{ background: '#f8f9fa', borderColor: '#e1e3e4' }}>
                  <p className="text-sm mb-4 italic" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>{t.texto}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ background: '#1b4332', color: '#86af99' }}>{t.inicial}</div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#191c1d' }}>{t.nombre}</p>
                      <p className="text-xs" style={{ color: '#717973' }}>{t.mascota}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Bento Grid */}
      <section className="py-32" style={{ background: '#f8f9fa' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
              style={{ color: '#012d1d' }}>
              <span className="w-8 h-px" style={{ background: '#012d1d', display: 'inline-block' }}></span>
              Por qué a domicilio
            </span>
            <h2 className="text-5xl font-bold leading-[1.05] mb-5" style={{ color: '#191c1d', letterSpacing: '-0.02em' }}>
              El bienestar de tu mascota empieza{' '}
              <span style={{ color: '#012d1d', fontStyle: 'italic', fontWeight: 300, fontFamily: 'var(--font-newsreader)' }}>
                en un entorno tranquilo
              </span>
            </h2>
            <p className="text-lg" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)', lineHeight: 1.6 }}>
              Cuatro razones por las que cientos de tutores eligieron Silvestra Vet en lugar de la clínica tradicional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-5" style={{ gridAutoRows: 'minmax(320px, auto)' }}>

            {/* Card 1 — Sin traslados (grande, claro) */}
            <article className="md:col-span-4 md:row-span-1 p-10 rounded-2xl flex flex-col justify-between relative overflow-hidden group"
              style={{ background: '#ffffff', border: '1px solid #e1e3e4' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#012d1d' }}>01 — En casa</span>
                <h3 className="text-3xl font-semibold mt-4 mb-3 max-w-sm" style={{ color: '#191c1d', letterSpacing: '-0.015em', lineHeight: 1.15 }}>
                  Sin jaula, sin traslado,{' '}
                  <span style={{ color: '#012d1d', fontStyle: 'italic', fontWeight: 300, fontFamily: 'var(--font-newsreader)' }}>
                    sin sala de espera
                  </span>
                </h3>
                <p className="text-base max-w-sm" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)', lineHeight: 1.6 }}>
                  Evita el pánico de la jaula de transporte. Tu mascota se queda en su sillón, su cama o su rincón favorito.
                </p>
              </div>
              {/* Ilustración: home-care (mascota con veterinario) — silueta verde forestal */}
              <div
                className="absolute top-1/2 right-2 -translate-y-1/2 w-[22rem] h-72 transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                style={{
                  WebkitMaskImage: 'url(/logo/home-care.svg)',
                  maskImage: 'url(/logo/home-care.svg)',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  backgroundColor: '#012d1d',
                }}
                aria-hidden
              />
            </article>

            {/* Card 2 — Atención personalizada (chico, oscuro) */}
            <article className="md:col-span-2 md:row-span-1 p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden"
              style={{ background: '#012d1d' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#fed65b' }}>02 — Una mascota a la vez</span>
                <h3 className="text-2xl font-semibold mt-4 mb-3" style={{ color: '#ffffff', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                  Atención dedicada,{' '}
                  <span style={{ color: '#b1f0ce', fontStyle: 'italic', fontWeight: 300, fontFamily: 'var(--font-newsreader)' }}>
                    sin reloj
                  </span>
                </h3>
              </div>
              {/* Ilustración: reloj con corazón en lugar de manillas */}
              <div className="self-end -mr-2 -mb-2">
                <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1b4332" strokeWidth="2" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#86af99" strokeWidth="1.5" strokeDasharray="2 6" />
                  {/* Corazón en el centro */}
                  <path d="M 60 75 C 50 65, 42 60, 42 50 C 42 44, 47 40, 53 42 C 56 43, 60 47, 60 47 C 60 47, 64 43, 67 42 C 73 40, 78 44, 78 50 C 78 60, 70 65, 60 75 Z"
                    fill="#fed65b" />
                </svg>
              </div>
              <p className="text-sm relative z-10" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-newsreader)', lineHeight: 1.5 }}>
                Una sola visita, una sola paciente. El tiempo es el que tu mascota necesite.
              </p>
            </article>

            {/* Card 3 — Ahorro de tiempo (chico, ámbar) */}
            <article className="md:col-span-2 md:row-span-1 p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden"
              style={{ background: '#fed65b' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#735c00' }}>03 — Tu día completo</span>
                <h3 className="text-2xl font-semibold mt-4 mb-3" style={{ color: '#191c1d', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                  Nosotros vamos{' '}
                  <span style={{ color: '#012d1d', fontStyle: 'italic', fontWeight: 300, fontFamily: 'var(--font-newsreader)' }}>
                    hasta ti
                  </span>
                </h3>
              </div>
              {/* Ilustración: pin de mapa con ruta */}
              <div className="self-end -mr-2 -mb-2">
                <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
                  {/* Ruta punteada */}
                  <path d="M 15 100 Q 35 80 50 75 T 90 40" stroke="#012d1d" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" fill="none" />
                  {/* Punto inicio */}
                  <circle cx="15" cy="100" r="4" fill="#012d1d" />
                  {/* Pin destino */}
                  <path d="M 90 30 C 80 30, 75 38, 75 47 C 75 58, 90 75, 90 75 C 90 75, 105 58, 105 47 C 105 38, 100 30, 90 30 Z"
                    fill="#012d1d" />
                  <circle cx="90" cy="46" r="5" fill="#fed65b" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)', lineHeight: 1.5 }}>
                Cero traslados, cero salas de espera, cero estacionamiento.
              </p>
            </article>

            {/* Card 4 — Respaldo clínico (grande, claro) */}
            <article className="md:col-span-4 md:row-span-1 p-10 rounded-2xl flex flex-col justify-between relative overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid #e1e3e4' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#012d1d' }}>04 — Respaldo clínico</span>
                <h3 className="text-3xl font-semibold mt-4 mb-3 max-w-md" style={{ color: '#191c1d', letterSpacing: '-0.015em', lineHeight: 1.15 }}>
                  Médica veterinaria titulada,{' '}
                  <span style={{ color: '#012d1d', fontStyle: 'italic', fontWeight: 300, fontFamily: 'var(--font-newsreader)' }}>
                    con formación científica
                  </span>
                </h3>
                <p className="text-base max-w-md" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)', lineHeight: 1.6 }}>
                  Titulada de la Universidad Santo Tomás, capacitada para prevenir, diagnosticar y tratar enfermedades bajo el enfoque de <em>una salud</em>: animal, humana y del medio ambiente. Atención con ética y responsabilidad clínica.
                </p>
              </div>

              {/* Sello credencial flotante con logo UST */}
              <div className="self-end mt-6 flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium" style={{ color: '#717973', fontFamily: 'var(--font-manrope)' }}>Titulada de</span>
                  <span className="text-sm font-semibold" style={{ color: '#012d1d', fontFamily: 'var(--font-manrope)' }}>Universidad Santo Tomás</span>
                </div>
                {/* Logo UST como mask, tematizado en verde forestal */}
                <div
                  className="w-[72px] h-[72px] flex-shrink-0"
                  style={{
                    WebkitMaskImage: 'url(/logo/ust-mark.svg)',
                    maskImage: 'url(/logo/ust-mark.svg)',
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    backgroundColor: '#012d1d',
                  }}
                  aria-label="Universidad Santo Tomás"
                  role="img"
                />
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* Servicios — registro editorial */}
      <section className="py-32" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12 md:gap-8">

            {/* Columna izquierda: encabezado, sticky en desktop */}
            <div className="md:col-span-5 md:sticky md:top-32 self-start">
              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4"
                style={{ color: '#012d1d' }}>
                <span className="w-8 h-px" style={{ background: '#012d1d', display: 'inline-block' }}></span>
                Servicios médicos
              </span>
              <h2 className="text-5xl font-bold leading-[1.05] mb-6" style={{ color: '#191c1d', letterSpacing: '-0.02em' }}>
                Procedimientos clínicos,{' '}
                <span style={{ color: '#012d1d', fontStyle: 'italic', fontWeight: 300, fontFamily: 'var(--font-newsreader)' }}>
                  con el rigor de una clínica
                </span>
              </h2>
              <p className="text-lg max-w-md" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)', lineHeight: 1.6 }}>
                Cada visita sigue protocolos clínicos verificables. Los exámenes de laboratorio se procesan en laboratorio externo certificado y los resultados llegan a tu cuenta en PDF.
              </p>
            </div>

            {/* Columna derecha: lista editorial numerada */}
            <ol className="md:col-span-7 flex flex-col">
              {[
                { num: '01', nombre: 'Vacunación', desc: 'Esquemas completos para cachorros y adultos. Cumplimos calendario nacional y aplicamos refuerzos según especie, raza y edad.' },
                { num: '02', nombre: 'Desparasitación interna', desc: 'Antiparasitarios de amplio espectro contra giardia, anquilostomas, áscaris y tenias. Pauta personalizada según peso y estilo de vida.' },
                { num: '03', nombre: 'Control clínico', desc: 'Examen físico completo: auscultación cardíaca y pulmonar, palpación abdominal, evaluación de mucosas, peso, temperatura y dentición.' },
                { num: '04', nombre: 'Curación de heridas', desc: 'Limpieza, desinfección, sutura simple si corresponde y vendaje profesional. Tratamos lesiones menores sin necesidad de traslado.' },
                { num: '05', nombre: 'Colocación de microchips', desc: 'Identificación permanente bajo norma ISO 11784/11785, con registro inmediato en la base nacional.' },
                {
                  num: '06',
                  nombre: 'Toma de muestras para laboratorio',
                  desc: 'Sangre y orina para análisis clínicos. Trabajamos con laboratorio veterinario certificado.',
                  panel: ['Hemograma completo', 'Perfil bioquímico', 'TSH', 'T4 total y libre'],
                },
              ].map((s, i) => (
                <li
                  key={s.num}
                  className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 py-8"
                  style={{ borderTop: i === 0 ? '1px solid #012d1d' : 'none', borderBottom: '1px solid #c1c8c2' }}
                >
                  <span
                    className="text-sm font-bold tabular-nums pt-1"
                    style={{ color: '#012d1d', letterSpacing: '0.05em' }}
                  >
                    {s.num}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-semibold" style={{ color: '#191c1d', letterSpacing: '-0.01em' }}>
                      {s.nombre}
                    </h3>
                    <p className="text-base" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)', lineHeight: 1.6 }}>
                      {s.desc}
                    </p>
                    {s.panel && (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style={{ color: '#717973' }}>
                        {s.panel.map((p) => (
                          <li key={p} className="inline-flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full" style={{ background: '#735c00' }} aria-hidden />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 relative overflow-hidden" style={{ background: '#012d1d' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(circle at center, white, transparent)' }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <h2 className="text-5xl font-bold mb-6" style={{ color: '#ffffff' }}>Agenda tu visita hoy</h2>
          <p className="text-xl mb-8 max-w-xl" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-newsreader)' }}>
            Asegura la tranquilidad de tu mascota con nuestra atención clínica de excelencia en casa.
          </p>
          <a href="https://wa.me/56912345678?text=Hola,%20quiero%20agendar%20una%20visita%20veterinaria"
            target="_blank"
            className="flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-lg transition-transform hover:scale-105"
            style={{ background: '#fed65b', color: '#191c1d' }}>
            💬 Agendar por WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#012d1d', color: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-10">

          {/* Bloque superior: 4 columnas */}
          <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">

            {/* Columna marca */}
            <div className="col-span-2 md:col-span-5 flex flex-col gap-5">
              <Logo size="md" variant="dark" />
              <p
                className="max-w-xs"
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontFamily: 'var(--font-newsreader)',
                  fontSize: '1.0625rem',
                  lineHeight: 1.6,
                }}
              >
                Atención veterinaria clínica en tu casa. Sin estrés para tu mascota, sin traslados para ti.
              </p>
              <a
                href="https://wa.me/56912345678?text=Hola,%20quiero%20agendar%20una%20visita%20veterinaria"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform hover:scale-105 self-start"
                style={{ background: '#fed65b', color: '#191c1d', fontFamily: 'var(--font-manrope)' }}
              >
                Agendar por WhatsApp
              </a>
            </div>

            {/* Espacio */}
            <div className="hidden md:block md:col-span-1" aria-hidden />

            {/* Columna navegación */}
            <nav className="md:col-span-3 flex flex-col gap-3">
              <span
                className="text-xs font-bold uppercase tracking-[0.18em] mb-2"
                style={{ color: '#fed65b' }}
              >
                Servicio
              </span>
              <Link href="/cobertura" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Área de cobertura
              </Link>
              <Link href="/registro" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Crear cuenta
              </Link>
              <Link href="/login" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Acceder a mi cuenta
              </Link>
              <Link href="/contacto" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Contacto
              </Link>
            </nav>

            {/* Columna legal */}
            <nav className="md:col-span-3 flex flex-col gap-3">
              <span
                className="text-xs font-bold uppercase tracking-[0.18em] mb-2"
                style={{ color: '#fed65b' }}
              >
                Legal
              </span>
              <Link href="/legal/privacidad" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Política de privacidad
              </Link>
              <Link href="/legal/terminos" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Términos de servicio
              </Link>
              <a href="mailto:privacidad@silvestravet.cl" className="text-sm hover:underline underline-offset-4" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-manrope)' }}>
                Datos personales
              </a>
            </nav>

          </div>

          {/* Línea inferior: copyright + ubicación */}
          <div
            className="mt-16 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-manrope)' }}>
              © 2025 Silvestra Vet. Todos los derechos reservados.
            </p>
            <p
              className="text-xs"
              style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-newsreader)', fontStyle: 'italic' }}
            >
              Hecho con cuidado clínico en Santiago de Chile.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-50"
        style={{ background: 'rgba(248,249,250,0.9)', backdropFilter: 'blur(8px)', borderTop: '1px solid #c1c8c2' }}>
        <a href="https://wa.me/56912345678?text=Hola,%20quiero%20agendar%20una%20visita%20veterinaria"
          target="_blank"
          className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-lg font-semibold"
          style={{ background: '#012d1d', color: '#ffffff' }}>
          💬 Agendar visita
        </a>
      </div>

    </main>
  );
}