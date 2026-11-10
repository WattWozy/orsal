'use client';

import { useState } from 'react';
import { CATALOG_FAMILIES, type Unit } from '@/data/catalog';

const INSTALLATION_FACTOR = 0.35;

const QUANTITY_LABEL: Record<Unit, string> = {
  m: 'Metros Lineales (m)',
  'm²': 'Superficie (m²)',
  ud: 'Unidades',
};

export default function PriceCalculator() {
  const allProducts = CATALOG_FAMILIES.flatMap((f) => f.products);
  const firstPriced = allProducts.find((p) => p.pricingConfigured) ?? allProducts[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(firstPriced?.id ?? '');
  const [quantity, setQuantity] = useState<number>(50);
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);

  const product = allProducts.find((p) => p.id === selectedProductId) ?? firstPriced;
  if (!product) return null;

  const hasPrice = product.pricingConfigured && product.salePrice != null;
  const unitPrice = product.salePrice ?? 0;

  const materialCost = unitPrice * quantity;
  const installationCost = includeInstallation ? materialCost * INSTALLATION_FACTOR : 0;
  const totalEstimate = materialCost + installationCost;

  const eur = (n: number) =>
    n.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  return (
    <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-xl">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-amber-500 block mb-1">
          Estimador Interactivo
        </span>
        <h3 className="text-2xl font-extrabold text-white">Calculadora de Presupuesto Aproximado</h3>
        <p className="text-xs text-slate-400 mt-1">
          Obtén un importe orientativo al instante antes de solicitar la valoración técnica definitiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Seleccionar Producto
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
          >
            {CATALOG_FAMILIES.map((family) => (
              <optgroup key={family.id} label={family.title}>
                {family.products.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.pricingConfigured}>
                    {p.name}
                    {!p.pricingConfigured ? ' (consultar)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            {QUANTITY_LABEL[product.unit]}
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Servicio de Montaje
          </label>
          <div className="flex items-center h-11 bg-slate-800 border border-slate-700 rounded-lg px-4">
            <input
              type="checkbox"
              id="inst"
              checked={includeInstallation}
              onChange={(e) => setIncludeInstallation(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 bg-slate-900 border-slate-700"
            />
            <label htmlFor="inst" className="ml-3 text-xs font-semibold text-slate-200 cursor-pointer">
              Incluir montaje y cimentación
            </label>
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs text-slate-400 block">Estimación orientativa (IVA no incl.):</span>
          {hasPrice ? (
            <>
              <div className="text-3xl font-black text-amber-500">~ {eur(totalEstimate)} €</div>
              <span className="text-[11px] text-slate-500">
                {eur(materialCost)}€ material
                {includeInstallation ? ` + ${eur(installationCost)}€ montaje` : ''}
                {' · '}
                {product.salePrice!.toFixed(2)} €/{product.unit}
              </span>
            </>
          ) : (
            <div className="text-xl font-bold text-slate-300">Precio bajo consulta</div>
          )}
        </div>

        <a
          href={`/contacto?producto=${encodeURIComponent(product.name)}&cant=${quantity}`}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shrink-0"
        >
          Solicitar Presupuesto Formal
        </a>
      </div>
    </div>
  );
}