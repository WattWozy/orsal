import Link from 'next/link';
import { CATALOG_FAMILIES } from '@/data/catalog';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-24 md:py-32 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block bg-amber-500/20 text-amber-400 text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full mb-6 border border-amber-500/30">
              Calidad Certificada ISO 9001
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-white">
              Ingeniería e instalación de cerramientos metálicos.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 font-light mb-8 max-w-2xl">
              Diseño, fabricación y montaje de cercados, verjas, instalaciones deportivas y automatización de accesos en Navarra.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contacto"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-7 py-3.5 rounded-lg text-center transition-all shadow-lg"
              >
                Pedir Presupuesto Sin Compromiso
              </Link>
              <Link
                href="/productos"
                className="border border-slate-600 hover:border-white text-white font-medium px-7 py-3.5 rounded-lg text-center transition-all"
              >
                Explorar Catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Productos/Servicios con Enlaces al Catálogo Detallado */}
      <section className="py-24 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-2">Especialidades</h2>
              <p className="text-3xl font-bold tracking-tight text-slate-900">Soluciones de cerramiento integral</p>
            </div>
            <Link href="/productos" className="mt-4 md:mt-0 text-sm font-semibold text-slate-800 hover:text-amber-600 transition-colors">
              Ver catálogo completo &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}