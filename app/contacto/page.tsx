'use client';

export default function ContactoPage() {
  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-2 block">Atención Directa</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Contacto y Presupuestos</h1>
          <p className="text-slate-700 mt-3 text-lg">
            Cuéntanos los detalles de tu proyecto de cerramiento. Te daremos asesoramiento técnico y presupuesto sin compromiso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Información de contacto */}
          <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Cercados Orsal S.L.L.</h3>
              <p className="text-slate-600 text-sm">Especialistas en cerramientos metálicos y automatismos en Navarra.</p>
            </div>
            
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <strong className="block text-slate-900 mb-0.5">Ubicación:</strong>
                Polígono Industrial Morea Sur, Nave 69<br />
                31191 Beriáin, Navarra
              </div>
              <div>
                <strong className="block text-slate-900 mb-0.5">Teléfono:</strong>
                +34 948 31 05 02
              </div>
              <div>
                <strong className="block text-slate-900 mb-0.5">Correo Electrónico:</strong>
                info@cercadosorsal.com
              </div>
              <div>
                <strong className="block text-slate-900 mb-0.5">Horario:</strong>
                Lunes a Viernes: 08:00 - 17:00
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-300 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); alert('Mensaje simulado enviado con éxito.'); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Nombre o Empresa</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-amber-500" placeholder="Tu nombre" required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Teléfono de contacto</label>
                  <input type="tel" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-amber-500" placeholder="+34 ..." required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Correo Electrónico</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-amber-500" placeholder="correo@ejemplo.com" required />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Detalles del proyecto</label>
                <textarea rows={4} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-amber-500" placeholder="Indíquenos metros lineales, tipo de cierre deseado, ubicación..." required></textarea>
              </div>

              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-lg text-sm transition-all shadow-md">
                Enviar Solicitud de Presupuesto
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}