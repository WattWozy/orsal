"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Field, Values } from "./lib/types";
import { StripSvg, fmt } from "./lib/scene";
import { PRODUCTS } from "./productos";

import { MAX_DRAW_POSTS, type OrderMetadata } from "./util/orderTypes";
import { localDateValue } from "./util/dateHelpers";
import { shareOrDownloadImage } from "./util/svgExport";
import { VISUALIZER_CSS } from "./util/visualizerStyles";

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
      onChange={(e) =>
        onChange(e.target.value === "" ? NaN : Number(e.target.value))
      }
    />
  );
}

export default function ProductVisualizerPage() {
  const [order, setOrder] = useState<OrderMetadata>({
    orderDate: "",
    deliveryDate: "",
    customerName: "",
    notes: "",
  });

  useEffect(() => {
    setOrder((prev) =>
      prev.orderDate ? prev : { ...prev, orderDate: localDateValue() }
    );
  }, []);

  const [productId, setProductId] = useState(PRODUCTS[0].id);

  const [all, setAll] = useState<Record<string, Values>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, { ...p.defaults }]))
  );

  const [isExporting, setIsExporting] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const v = all[product.id];

  const inputKeys = [...product.client, ...product.margins].map((f) => f.key);
  const inputsOk = inputKeys.every((k) => Number.isFinite(v[k]));

  const o = useMemo(
    () => (inputsOk ? product.compute(v) : {}),
    [product, v, inputsOk]
  );

  const checksOk =
    inputsOk && product.checks.every((k) => Number.isFinite(o[k]) && o[k] > 0);

  const tooMany =
    product.family === "Vallas" && Number.isFinite(o.n) && o.n > MAX_DRAW_POSTS;

  const canDraw = checksOk && !tooMany;

  const set = (k: string, n: number) =>
    setAll((prev) => ({
      ...prev,
      [product.id]: { ...prev[product.id], [k]: n },
    }));

  const reset = () =>
    setAll((prev) => ({
      ...prev,
      [product.id]: { ...product.defaults },
    }));

  const updateOrder = (key: keyof OrderMetadata, value: string) => {
    setOrder((prev) => ({ ...prev, [key]: value }));
  };

  const handleShareImage = async () => {
    setIsExporting(true);
    try {
      await shareOrDownloadImage(
        wrapRef.current,
        product.id,
        product.label,
        order
      );
    } finally {
      setIsExporting(false);
    }
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
      <style>{VISUALIZER_CSS}</style>

      <h1>Visualizador de producto</h1>
      <p className="sub">
        Medidas en milímetros. Cambia las medidas del cliente o las holguras y
        el plano se actualiza.
      </p>

      <div className="ov-grid">
        <section className="ov-panel" aria-label="Datos del pedido y producto">
          <fieldset>
            <legend>Datos del pedido</legend>

            <label className="sel">
              Nombre del cliente
              <input
                type="text"
                value={order.customerName}
                onChange={(e) => updateOrder("customerName", e.target.value)}
                placeholder="Nombre del cliente"
              />
            </label>

            <label className="sel">
              Fecha de pedido
              <input
                type="date"
                value={order.orderDate}
                onChange={(e) => updateOrder("orderDate", e.target.value)}
              />
            </label>

            <label className="sel">
              Fecha de entrega
              <input
                type="date"
                value={order.deliveryDate}
                onChange={(e) => updateOrder("deliveryDate", e.target.value)}
              />
            </label>

            <label className="sel">
              Notas ({order.notes.length}/500)
              <textarea
                maxLength={500}
                rows={4}
                value={order.notes}
                onChange={(e) => updateOrder("notes", e.target.value)}
                placeholder="Observaciones del pedido..."
              />
            </label>
          </fieldset>

          <label className="sel">
            Producto
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
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
              {product.family === "Vallas" ? "Valla" : "Puerta"} ·{" "}
              {product.label}
            </h2>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className={"status " + (checksOk ? "ok" : "bad")}>
                {checksOk ? "OK" : "REVISAR"}
              </span>

              <button
                type="button"
                onClick={handleShareImage}
                disabled={!canDraw || isExporting}
              >
                {isExporting ? "Generando..." : "Compartir plano"}
              </button>
            </div>
          </div>

          {!inputsOk && (
            <div className="warn">
              Falta algún valor numérico. Rellena todos los campos para ver el
              plano.
            </div>
          )}

          {inputsOk && !checksOk && (
            <div className="warn">
              Alguna medida resultante es cero o negativa: las holguras no
              caben en el hueco indicado. Revisa los valores.
            </div>
          )}

          {tooMany && (
            <div className="warn">
              Salen más de {MAX_DRAW_POSTS} paneles y el dibujo no sería
              legible. Aumenta el ancho máximo de panel o reduce la longitud.
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