"use client";

/**
 * Visualizador de producto con acotaciones y holguras (vallas y puertas).
 *
 * - lib/types.ts      tipos compartidos
 * - lib/scene.tsx     motor gráfico SVG (escena, cotas, suelo, hoja, franjas)
 * - lib/puertas.tsx   piezas comunes a las puertas
 * - productos/*       un módulo por producto (o familia): defaults, compute, Drawing, strips
 * - productos/index   catálogo PRODUCTS
 *
 * Todo en milímetros. Las fórmulas replican el Excel "Calculadora_margenes_vallas_puertas".
 */

import { useMemo, useRef, useState } from "react";
import type { Field, Values } from "./lib/types";
import { StripSvg, fmt } from "./lib/scene";
import { PRODUCTS } from "./productos";

const MAX_DRAW_POSTS = 150;

/* ======================================================================
   PÁGINA
   ====================================================================== */

const CSS = `
.ov{max-width:1280px;margin:0 auto;padding:24px 20px 56px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.ov h1{font-size:22px;font-weight:650;margin:0 0 4px}
.ov .sub{opacity:.7;margin:0 0 20px;font-size:14px}
.ov-grid{display:grid;grid-template-columns:340px minmax(0,1fr);gap:28px;align-items:start}
@media (max-width:920px){.ov-grid{grid-template-columns:1fr}}
.ov-panel{display:flex;flex-direction:column;gap:18px}
.ov label.sel{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600}
.ov select,.ov input{font:inherit;color:inherit;background:transparent;border:1px solid rgba(128,128,128,.45);border-radius:6px;padding:7px 9px}
.ov select{font-size:15px;padding:9px}
.ov select:focus-visible,.ov input:focus-visible,.ov button:focus-visible{outline:2px solid #2f5597;outline-offset:1px}
.ov fieldset{border:1px solid rgba(128,128,128,.35);border-radius:8px;padding:12px 14px 14px;margin:0}
.ov legend{font-size:13px;font-weight:650;padding:0 6px}
.ov .row{display:grid;grid-template-columns:1fr 104px;gap:8px;align-items:center;margin-top:8px}
.ov .row span.l{font-size:13px;line-height:1.25}
.ov .row small{display:block;opacity:.6;font-size:11px}
.ov .row input{text-align:right;width:100%;box-sizing:border-box}
.ov .row input.client{background:rgba(255,235,0,.18)}
.ov .row input.bad{border-color:#b3261e}
.ov .sheet{border:1px solid rgba(128,128,128,.35);border-radius:8px;overflow:hidden;background:#fff}
.ov .sheetbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 10px}
.ov .sheetbar h2{font-size:16px;margin:0;font-weight:650}
.ov button{font:inherit;font-size:13px;color:inherit;background:transparent;border:1px solid rgba(128,128,128,.5);border-radius:6px;padding:7px 12px;cursor:pointer}
.ov button:hover{background:rgba(128,128,128,.12)}
.ov .strips{display:grid;gap:10px;margin-top:12px}
.ov .warn{border:1px solid #b3261e;border-radius:8px;padding:14px 16px;font-size:14px;color:#b3261e;background:rgba(179,38,30,.08)}
.ov .status{display:inline-block;font-size:12px;font-weight:650;padding:3px 9px;border-radius:99px}
.ov .status.ok{background:rgba(46,125,50,.16);color:#2e7d32}
.ov .status.bad{background:rgba(179,38,30,.14);color:#b3261e}
.ov table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
.ov td{padding:7px 4px;border-bottom:1px solid rgba(128,128,128,.25)}
.ov td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ov td.u{width:34px;opacity:.6;font-size:12px}
.ov tr.main td{font-weight:650}
.ov .legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;opacity:.75;margin-top:10px}
.ov .legend i{display:inline-block;width:12px;height:12px;border:1px solid #1d2733;vertical-align:-2px;margin-right:5px}
`;

function NumInput({
  value,
  onChange,
  client,
  bad,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  client?: boolean;
  bad?: boolean;
  id: string;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      step="any"
      className={(client ? "client " : "") + (bad ? "bad" : "")}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
    />
  );
}

export default function ProductVisualizerPage() {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [all, setAll] = useState<Record<string, Values>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, { ...p.defaults }]))
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const v = all[product.id];
  const inputKeys = [...product.client, ...product.margins].map((f) => f.key);
  const inputsOk = inputKeys.every((k) => Number.isFinite(v[k]));

  const o = useMemo(() => (inputsOk ? product.compute(v) : {}), [product, v, inputsOk]);
  const checksOk = inputsOk && product.checks.every((k) => Number.isFinite(o[k]) && o[k] > 0);
  const tooMany = product.family === "Vallas" && Number.isFinite(o.n) && o.n > MAX_DRAW_POSTS;
  const canDraw = checksOk && !tooMany;

  const set = (k: string, n: number) =>
    setAll((prev) => ({ ...prev, [product.id]: { ...prev[product.id], [k]: n } }));

  const reset = () => setAll((prev) => ({ ...prev, [product.id]: { ...product.defaults } }));

  const downloadSvg = () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const vb = svg.viewBox.baseVal;
    clone.setAttribute("width", String(Math.round(vb.width)));
    clone.setAttribute("height", String(Math.round(vb.height)));
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const families: Array<"Vallas" | "Puertas"> = ["Vallas", "Puertas"];
  const Drawing = product.Drawing;

  const renderFields = (fields: Field[], client: boolean) =>
    fields.map((f) => (
      <div className="row" key={f.key}>
        <label htmlFor={`f-${f.key}`}>
          <span className="l">
            {f.label}
            {f.hint && <small>{f.hint}</small>}
          </span>
        </label>
        <NumInput
          id={`f-${f.key}`}
          value={v[f.key]}
          client={client}
          bad={!Number.isFinite(v[f.key])}
          onChange={(n) => set(f.key, n)}
        />
      </div>
    ));

  return (
    <main className="ov">
      <style>{CSS}</style>
      <h1>Visualizador de producto</h1>
      <p className="sub">Medidas en milímetros. Cambia las medidas del cliente o las holguras y el plano se actualiza.</p>

      <div className="ov-grid">
        <section className="ov-panel" aria-label="Datos del producto">
          <label className="sel">
            Producto
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {families.map((fam) => (
                <optgroup key={fam} label={fam}>
                  {PRODUCTS.filter((p) => p.family === fam).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>Medidas del cliente (mm)</legend>
            {renderFields(product.client, true)}
          </fieldset>

          <fieldset>
            <legend>Holguras y márgenes (mm)</legend>
            {renderFields(product.margins, false)}
          </fieldset>

          <div>
            <button type="button" onClick={reset}>
              Restablecer valores de ejemplo
            </button>
          </div>
        </section>

        <section aria-label="Plano y resultados">
          <div className="sheetbar">
            <h2>
              {product.family === "Vallas" ? "Valla" : "Puerta"} · {product.label}
            </h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className={"status " + (checksOk ? "ok" : "bad")}>{checksOk ? "OK" : "REVISAR"}</span>
              <button type="button" onClick={downloadSvg} disabled={!canDraw}>
                Descargar SVG
              </button>
            </div>
          </div>

          {!inputsOk && <div className="warn">Falta algún valor numérico. Rellena todos los campos para ver el plano.</div>}
          {inputsOk && !checksOk && (
            <div className="warn">
              Alguna medida resultante es cero o negativa: las holguras no caben en el hueco indicado. Revisa los valores.
            </div>
          )}
          {tooMany && (
            <div className="warn">
              Salen más de {MAX_DRAW_POSTS} paneles y el dibujo no sería legible. Aumenta el ancho máximo de panel o reduce la longitud.
            </div>
          )}

          {canDraw && (
            <>
              <div className="sheet" ref={wrapRef}>
                <Drawing v={v} o={o} />
              </div>
              <div className="legend" aria-hidden>
                <span>
                  <i style={{ background: "#cfd6de" }} />
                  Poste / pilar
                </span>
                <span>
                  <i style={{ background: "#dbe7f5" }} />
                  Panel / hoja / malla
                </span>
                <span>
                  <i style={{ background: "#ffe3a3" }} />
                  Holgura
                </span>
              </div>
              <div className="strips">
                {product.strips(v, o).map((st) => (
                  <div className="sheet" key={st.title}>
                    <StripSvg strip={st} />
                  </div>
                ))}
              </div>
            </>
          )}

          {inputsOk && (
            <table>
              <tbody>
                {product.outputs.map((r) => (
                  <tr key={r.key} className={r.main ? "main" : undefined}>
                    <td>{r.label}</td>
                    <td className="n">{fmt(o[r.key])}</td>
                    <td className="u">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}