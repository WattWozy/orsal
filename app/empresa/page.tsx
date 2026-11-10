export default function EmpresaPage() {
  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-2 block">Nuestra Trayectoria</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Sobre Cercados Orsal</h1>
          <p className="text-slate-700 mt-3 text-lg leading-relaxed">
            Desde nuestras instalaciones en Beriáin (Navarra), ofrecemos soluciones profesionales en cerramientos metálicos, verjas y automatismos orientados tanto al sector industrial como residencial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Compromiso con la Calidad</h3>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              Trabajamos bajo estrictos estándares de calidad acreditados por normativas europeas. Contamos con certificación ISO 9001 que avala nuestros procesos de fabricación y montaje.
            </p>
            <p className="text-slate-700 text-sm leading-relaxed">
              Cada estructura metálica cuenta con tratamientos anticorrosión de alta gama para asegurar una durabilidad excepcional frente a las condiciones climatológicas más exigentes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Instalaciones Propias</h3>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              Disponemos de nave industrial propia equipada con maquinaria avanzada para el corte, conformado y lacado de componentes metálicos, reduciendo plazos de entrega y garantizando acabados a medida.
            </p>
            <p className="text-slate-700 text-sm leading-relaxed">
              Nuestro equipo técnico realiza el montaje sobre el terreno con flota y herramientas especializadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}