'use client';

import { useState } from 'react';
import {
  CATALOG_FAMILIES,
  DOOR_AVAILABLE_HEIGHTS,
  FENCE_AVAILABLE_HEIGHTS,
} from '@/data/catalog';

const INSTALLATION_FACTOR = 0.35; // Factor de montaje sobre el coste de material/venta

export default function PriceCalculator() {
  const allProducts = CATALOG_FAMILIES.flatMap((family) =>
    family.products.map((product) => ({
      ...product,
      familyId: family.id,
      familyTitle: family.title,
      // Usamos de forma segura product.family o el id/title de la categoría
      isDoor: 
        (product.family ?? "").toLowerCase().includes('puerta') || 
        family.title.toLowerCase().includes('puerta') || 
        family.id.toLowerCase().includes('puerta'),
    }))
  );

  const firstPriced = allProducts.find((p) => p.pricingConfigured) ?? allProducts[0];

  const [selectedProductId, setSelectedProductId] = useState<string>(firstPriced?.id ?? '');
  const [width, setWidth] = useState<number>(1.0); // Ancho / Hueco en metros
  const [height, setHeight] = useState<number>(1.5); // Altura en metros
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);

  const product = allProducts.find((p) => p.id === selectedProductId) ?? firstPriced;
  if (!product) return null;

  const availableHeights = product.isDoor ? DOOR_AVAILABLE_HEIGHTS : FENCE_AVAILABLE_HEIGHTS;

  const handleProductChange = (newId: string) => {
    setSelectedProductId(newId);
    const nextProduct = allProducts.find((p) => p.id === newId);
    if (nextProduct) {
      const nextHeights = nextProduct.isDoor ? DOOR_AVAILABLE_HEIGHTS : FENCE_AVAILABLE_HEIGHTS;
      if (!nextHeights.includes(height)) {
        setHeight(nextHeights[0] ?? 1.5);
      }
    }
  };

  // --- CÁLCULO DINÁMICO BASADO EN LOS COMPONENTES DEL EXCEL ---
  let calculatedMaterialCost = 0;
  let calculatedLaborCost = product.laborCost || 0;
  let calculationDetail = '';

  if (product.pricingConfigured && product.components && product.components.length > 0) {
    // Tomamos como referencia una medida estándar base (ej: 1m de ancho x 1.5m de alto = 1.5 m² o 1 ml)
    // Evaluamos cada componente del JSON del Excel
    const scaledComponents = product.components.map((comp) => {
      let adjustedQuantity = comp.quantity;

      // Si el componente es área (m² de mallazo, chapa, etc.) o peso proporcional (kg de tubo)
      // lo escalamos según la superficie o las dimensiones introducidas por el cliente.
      if (comp.unit === 'm²' || comp.name.toLowerCase().includes('m²') || comp.name.toLowerCase().includes('kg')) {
        // Asumimos una medida estándar base de referencia de 1.5 m² si no se especifica otra
        const baseStandardArea = 1.5; 
        const userArea = width * height;
        const scaleFactor = userArea / baseStandardArea;
        adjustedQuantity = comp.quantity * Math.max(0.5, scaleFactor);
      } else if (comp.unit === 'm' || comp.name.toLowerCase().includes('metro')) {
        adjustedQuantity = comp.quantity * width;
      }
      // Los componentes unitarios (bisagras, cerraduras, tornillería) suelen mantenerse fijos por puerta/tramo

      const compCost = adjustedQuantity * comp.unitPrice * (1 + (comp.waste || 0));
      return compCost;
    });

    calculatedMaterialCost = scaledComponents.reduce((acc, curr) => acc + curr, 0);
    
    // Aplicamos un margen comercial estándar si viene del excel o simulamos el salePrice proporcional
    // Si el producto original tenía un salePrice y materialCost base, calculamos la proporción de beneficio:
    const baseMaterialCost = product.materialCost || 1;
    const marginMultiplier = product.salePrice && baseMaterialCost > 0 ? product.salePrice / baseMaterialCost : 1.35;
    
    var finalMaterialSalePrice = calculatedMaterialCost * marginMultiplier;
    calculationDetail = `${width}m ancho × ${height}m alto (${product.components.length} componentes analizados)`;
  } else {
    // Fallback si no tiene componentes configurados
    var finalMaterialSalePrice = (product.salePrice ?? 100) * width;
    calculationDetail = `Precio base estimado`;
  }

  const installationCost = includeInstallation ? finalMaterialSalePrice * INSTALLATION_FACTOR : 0;
  const totalEstimate = finalMaterialSalePrice + installationCost;

  const eur = (n: number) =>
    n.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  const contactParams = new URLSearchParams({
    producto: product.name,
    familia: product.familyTitle || product.family,
    ancho: width.toString(),
    alto: height.toString(),
    montaje: includeInstallation ? 'si' : 'no',
  });

  return (
    <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-xl">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-amber-500 block mb-1">
          Cercados Orsal — Estimador Dinámico por Componentes
        </span>
        <h3 className="text-2xl font-extrabold text-white">Calculadora de Presupuesto Aproximado</h3>
        <p className="text-xs text-slate-400 mt-1">
          Calculando costes reales a partir de perfiles, mallazos, tornillería y mano de obra del catálogo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* 1. Producto */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Producto / Modelo
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
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

        {/* 2. Hueco / Ancho */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            {product.isDoor ? 'Ancho de Paso (m)' : 'Metros Lineales / Hueco (m)'}
          </label>
          <input
            type="number"
            step={product.isDoor ? 0.1 : 1}
            min={0.5}
            value={width}
            onChange={(e) => setWidth(Math.max(0.5, Number(e.target.value) || 0.5))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* 3. Altura */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Altura (m)
          </label>
          <select
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
          >
            {availableHeights.map((h) => (
              <option key={h} value={h}>
                {h.toFixed(2)} m
              </option>
            ))}
          </select>
        </div>

        {/* 4. Montaje */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Instalación
          </label>
          <div className="flex items-center h-[46px] bg-slate-800 border border-slate-700 rounded-lg px-4">
            <input
              type="checkbox"
              id="inst"
              checked={includeInstallation}
              onChange={(e) => setIncludeInstallation(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 bg-slate-900 border-slate-700"
            />
            <label htmlFor="inst" className="ml-3 text-xs font-semibold text-slate-200 cursor-pointer">
              Incluir montaje
            </label>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs text-slate-400 block">Estimación orientativa (IVA no incl.):</span>
          {product.pricingConfigured ? (
            <>
              <div className="text-3xl font-black text-amber-500">~ {eur(totalEstimate)} €</div>
              <span className="text-[11px] text-slate-500">
                {eur(finalMaterialSalePrice)}€ materiales desglosados
                {includeInstallation ? ` + ${eur(installationCost)}€ montaje` : ''}
                {' · '}
                {calculationDetail}
              </span>
            </>
          ) : (
            <div className="text-xl font-bold text-slate-300">Precio bajo consulta</div>
          )}
        </div>

        <a
          href={`/contacto?${contactParams.toString()}`}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shrink-0"
        >
          Solicitar Presupuesto Formal
        </a>
      </div>
    </div>
  );
}