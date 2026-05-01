import Link from 'next/link';

export default function Home() {
  return (
    <main className="w-full relative" style={{ fontFamily: 'var(--font-manrope)' }}>

      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center pt-24 pb-32 overflow-hidden"
        style={{ background: '#f8f9fa' }}>
        <div className="absolute inset-0 z-0">
          <img
            src="/close-up-veterinarian-taking-care-dog.jpg"
            alt="Veterinario con mascota"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #f8f9fa 50%, transparent)' }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 w-full relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              style={{ color: '#012d1d' }}>
              <span className="w-8 h-px" style={{ background: '#012d1d', display: 'inline-block' }}></span>
              Veterinario a domicilio premium
            </span>

            <h1 className="text-5xl font-bold leading-tight" style={{ color: '#191c1d', letterSpacing: '-0.02em' }}>
              Veterinario a domicilio premium —{' '}
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
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all hover:bg-gray-50"
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
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#191c1d' }}>Por qué elegir atención a domicilio</h2>
            <p className="text-xl" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>El bienestar de tu mascota comienza con un entorno tranquilo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ gridAutoRows: '250px' }}>
            <div className="md:col-span-2 p-8 rounded-xl flex flex-col justify-end relative overflow-hidden group"
              style={{ background: '#ffffff', border: '1px solid #e1e3e4' }}>
              <div className="absolute right-0 top-0 w-64 h-64 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"
                style={{ background: 'rgba(1,45,29,0.05)' }}></div>
              <span className="text-4xl mb-auto">🏠</span>
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#191c1d' }}>Sin traslados ni estrés</h3>
              <p className="text-sm" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>Evita el pánico de la jaula de transporte y las salas de espera ruidosas.</p>
            </div>
            <div className="p-8 rounded-xl flex flex-col justify-end" style={{ background: '#012d1d' }}>
              <span className="text-4xl mb-auto">❤️</span>
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#ffffff' }}>Atención personalizada</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-newsreader)' }}>Tiempo dedicado exclusivamente a tu mascota.</p>
            </div>
            <div className="p-8 rounded-xl flex flex-col justify-end" style={{ background: '#fed65b' }}>
              <span className="text-4xl mb-auto">⏰</span>
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#191c1d' }}>Ahorro de tiempo</h3>
              <p className="text-sm" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>Nosotros vamos a ti, optimizando tu día.</p>
            </div>
            <div className="md:col-span-2 p-8 rounded-xl flex flex-col justify-end relative overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid #e1e3e4' }}>
              <span className="text-4xl mb-auto relative z-10">✅</span>
              <h3 className="text-2xl font-semibold mb-2 relative z-10" style={{ color: '#191c1d' }}>Profesional confiable</h3>
              <p className="text-sm relative z-10" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>Médico veterinario certificado con experiencia en manejo amigable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-32" style={{ background: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12 pl-6" style={{ borderLeft: '4px solid #012d1d' }}>
            <h2 className="text-4xl font-bold mb-2" style={{ color: '#191c1d' }}>Nuestros Servicios Médicos</h2>
            <p className="text-xl max-w-2xl" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>
              Procedimientos clínicos realizados con los más altos estándares de calidad, en la comodidad de tu hogar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '💉', nombre: 'Vacunación', desc: 'Esquemas completos para cachorros y adultos, manteniendo la inmunidad al día.' },
              { icon: '💊', nombre: 'Desparasitación interna', desc: 'Control y prevención de parásitos para la salud de tu mascota y familia.' },
              { icon: '🩺', nombre: 'Control médico', desc: 'Examen físico completo y evaluación general del estado de salud.' },
              { icon: '🩹', nombre: 'Curación de heridas', desc: 'Limpieza, desinfección y vendaje profesional de lesiones menores.' },
              { icon: '📡', nombre: 'Colocación de microchips', desc: 'Identificación permanente y registro seguro bajo normativa vigente.' },
              { icon: '🔬', nombre: 'Toma de muestras', desc: 'Análisis clínicos: Hemograma, Perfil bioquímico, TSH, T4.' },
            ].map((s) => (
              <div key={s.nombre} className="group p-6 rounded-xl border transition-all duration-300 hover:border-green-800 hover:bg-gray-50 cursor-pointer"
                style={{ borderColor: '#c1c8c2' }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-2xl transition-colors"
                  style={{ background: 'rgba(1,45,29,0.08)' }}>
                  {s.icon}
                </div>
                <h4 className="font-semibold mb-2" style={{ color: '#191c1d' }}>{s.nombre}</h4>
                <p className="text-sm" style={{ color: '#414844', fontFamily: 'var(--font-newsreader)' }}>{s.desc}</p>
              </div>
            ))}
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
      <footer className="py-12 border-t" style={{ background: '#f8f9fa', borderColor: '#e1e3e4' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-black text-sm" style={{ color: '#012d1d' }}>AMAVET</span>
            <p className="text-sm mt-1" style={{ color: '#414844' }}>© 2025 AMAVET Veterinario a Domicilio. Excelencia clínica en tu hogar.</p>
          </div>
          <div className="flex gap-6">
            {['Política de Privacidad', 'Términos de Servicio', 'Área de Cobertura', 'Contacto'].map(l => (
              <a key={l} href="#" className="text-sm hover:underline" style={{ color: '#717973' }}>{l}</a>
            ))}
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