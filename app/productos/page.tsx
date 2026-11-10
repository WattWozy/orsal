import { CATALOG_FAMILIES } from '@/data/catalog';
import PriceCalculator from '@/components/PriceCalculator';
import Link from 'next/link';

export default function ProductosPage() {
  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-amber-600 mb-2 block">
            Catálogo Técnico Profesional
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Familias de Productos y Soluciones
          </h1>
          <p className="text-slate-700 mt-3 text-lg leading-relaxed">
            Explora nuestra gama de productos en detalle. Fabricación propia, tratamiento anticorrosivo avanzado y certificados bajo norma ISO 9001.
          </p>
        </div>

        {/* Calculadora Interactiva */}
        <div className="mb-20">
          <PriceCalculator />
        </div>

        {/* Listado de Familias de Productos */}
        <div className="space-y-20">
          {CATALOG_FAMILIES.map((family) => (
            <section key={family.id} id={family.id} className="scroll-mt-28">
              <div className="border-b border-slate-300 pb-4 mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 block mb-1">
                  {family.tagline}
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900">{family.title}</h2>
                <p className="text-slate-700 text-sm mt-2 max-w-3xl">{family.description}</p>
              </div>

              {/* Subproductos de la familia */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {family.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white p-7 rounded-xl border border-slate-300 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{prod.name}</h3>
                      <p className="text-slate-700 text-xs leading-relaxed mb-6">
                        {prod.description}
                      </p>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                          Especificaciones:
                        </span>
                        <ul className="space-y-1.5">
                          {prod.specs.map((spec, idx) => (
                            <li key={idx} className="text-xs text-slate-800 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                              <span>{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {prod.basePricePerMeter
                          ? `Desde ${prod.basePricePerMeter} €/m`
                          : `Desde ${prod.basePriceUnit} €/ud`}
                      </span>
                      <Link
                        href={`/contacto?producto=${encodeURIComponent(prod.name)}`}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider"
                      >
                        Consultar &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
}