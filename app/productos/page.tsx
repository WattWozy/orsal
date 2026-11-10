import { CATEGORIES } from '@/data/catalog';
import Link from 'next/link';

export default function ProductosPage() {
  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-2 block">Catálogo Técnico</span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Productos y Servicios</h1>
          <p className="text-slate-700 mt-3 text-lg">
            Sistemas modulares y soluciones a medida para todo tipo de cerramientos perimetrales y de seguridad.
          </p>
        </div>

        <div className="space-y-12">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} id={cat.id} className="bg-white p-8 md:p-10 rounded-xl border border-slate-300 shadow-sm scroll-mt-28">
              <div className="w-12 h-1.5 rounded bg-amber-500 mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{cat.title}</h2>
              <p className="text-slate-700 text-base mb-6 max-w-3xl leading-relaxed">{cat.description}</p>
              
              <div className="mb-8">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-900 mb-3">Características principales:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.features.map((feat, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/contacto" className="inline-block bg-slate-900 text-white font-medium px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-amber-500 hover:text-slate-950 transition-colors">
                Solicitar presupuesto para este producto
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}