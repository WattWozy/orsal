export default function ProyectosPage() {
  const proyectosEjemplo = [
    { title: 'Cerramiento Perimetral Parque Logístico', ubicacion: 'Navarra', tipo: 'Industrial' },
    { title: 'Instalación de Verjas Rígidas Residenciales', ubicacion: 'Pamplona', tipo: 'Residencial' },
    { title: 'Cercado Metálico Complejo Deportivo', ubicacion: 'Tudela', tipo: 'Deportivo' },
    { title: 'Puerta Corredera Automática Industriales', ubicacion: 'Beriáin', tipo: 'Automatización' },
  ];

  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-2 block">Experiencia y Obras</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Proyectos Realizados</h1>
          <p className="text-slate-700 mt-3 text-lg">
            Una selección de nuestros montajes y ejecuciones de cerramientos metálicos y puertas automatizadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {proyectosEjemplo.map((p, idx) => (
            <div key={idx} className="bg-white p-8 rounded-xl border border-slate-300 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-block bg-amber-100 text-amber-800 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md mb-4">
                  {p.tipo}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-600 text-sm mb-6">Ubicación: <strong className="text-slate-800">{p.ubicacion}</strong></p>
              </div>
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>EJECUCIÓN CERTIFICADA</span>
                <span className="text-amber-600">ORSAL &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}