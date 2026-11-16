"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Field, Values } from "./lib/types";
import { StripSvg, fmt } from "./lib/scene";
import { PRODUCTS } from "./productos";

const MAX_DRAW_POSTS = 150;
const SVG_NS = "http://www.w3.org/2000/svg";

/* Hoja de pedido: medidas y paleta (misma que el dibujo para que no desentone) */
const HEADER_HEIGHT = 132;
const SHEET_PADDING = 28;
const NOTES_LINE = 18;
const INK = "#1d2733";
const MUTED = "#51606f";
const FAINT = "#7a8794";
const RULE = "#b8c0c8";
const ALERT = "#b3261e"; // mismo rojo que las cotas

type OrderMetadata = {
  orderDate: string;
  deliveryDate: string;
  customerName: string;
  notes: string;
};

function localDateValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "Pendiente";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {}
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function addText(
  parent: SVGElement,
  value: string,
  x: number,
  y: number,
  options: {
    size?: number;
    weight?: string;
    fill?: string;
    anchor?: "start" | "middle" | "end";
  } = {}
) {
  const text = svgElement("text", {
    x: String(x),
    y: String(y),
    "font-family": "Arial, Helvetica, sans-serif",
    "font-size": String(options.size ?? 14),
    "font-weight": options.weight ?? "normal",
    "text-anchor": options.anchor ?? "start",
    fill: options.fill ?? INK,
  });

  text.textContent = value;
  parent.appendChild(text);

  return text;
}

/** Parte el texto en líneas de `maxChars`, respetando los saltos de línea del textarea. */
function wrapText(value: string, maxChars: number): string[] {
  const lines: string[] = [];

  for (const paragraph of value.replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      if (word.length > maxChars) {
        if (current) {
          lines.push(current);
          current = "";
        }

        for (let i = 0; i < word.length; i += maxChars) {
          lines.push(word.slice(i, i + maxChars));
        }

        continue;
      }

      const candidate = current ? `${current} ${word}` : word;

      if (candidate.length > maxChars) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  return lines.length > 0 ? lines : ["—"];
}

/**
 * Construye una hoja técnica SVG:
 * cabecera + dibujo original + pie de página.
 *
 * El dibujo se traslada sin modificar su escala ni coordenadas internas.
 */
function enrichSvg(
  original: SVGSVGElement,
  productLabel: string,
  order: OrderMetadata
): SVGSVGElement {
  const clone = original.cloneNode(true) as SVGSVGElement;
  const vb = original.viewBox.baseVal;

  const width = vb.width;
  const originalHeight = vb.height;
  const originalX = vb.x;
  const originalY = vb.y;

  // ~7,2 px por carácter a 13 px de Arial: margen de seguridad para no salirse de la hoja.
  const maxChars = Math.floor((width - 2 * SHEET_PADDING) / 7.2);
  const notesLines = wrapText(order.notes, maxChars);

  // Pie: título de notas, líneas de notas y, debajo, la firma de la hoja.
  const footerY = HEADER_HEIGHT + originalHeight;
  const notesStartY = footerY + 53;
  const lastNoteY = notesStartY + (notesLines.length - 1) * NOTES_LINE;
  const creditY = lastNoteY + 32;
  const totalHeight = creditY + 16;

  // Configure the new canvas.
  clone.setAttribute("viewBox", `${originalX} 0 ${width} ${totalHeight}`);
  clone.setAttribute("width", String(Math.ceil(width)));
  clone.setAttribute("height", String(Math.ceil(totalHeight)));
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");

  // Preserve SVG styles and definitions.
  const preserved = Array.from(clone.children).filter(
    (element) =>
      element.tagName.toLowerCase() === "style" ||
      element.tagName.toLowerCase() === "defs"
  );

  // Move the original drawing into a translated group.
  // Its internal geometry and scale remain unchanged.
  const drawing = svgElement("g", {
    transform: `translate(0 ${HEADER_HEIGHT - originalY})`,
  });

  const background = svgElement("rect", {
    x: String(originalX),
    y: "0",
    width: String(width),
    height: String(totalHeight),
    fill: "#ffffff",
  });

  const originalElements = Array.from(clone.children).filter(
    (element) =>
      element.tagName.toLowerCase() !== "style" &&
      element.tagName.toLowerCase() !== "defs"
  );

  originalElements.forEach((element) => {
    drawing.appendChild(element);
  });

  const right = width - SHEET_PADDING;

  // Header.
  const header = svgElement("g");

  addText(header, "ORSAL", SHEET_PADDING, 37, { size: 25, weight: "bold" });

  addText(header, "DOCUMENTO TÉCNICO DE PEDIDO", right, 35, {
    size: 13,
    weight: "bold",
    fill: MUTED,
    anchor: "end",
  });

  // Customer.
  addText(header, "CLIENTE", SHEET_PADDING, 63, {
    size: 10,
    weight: "bold",
    fill: MUTED,
  });

  addText(header, order.customerName.trim() || "Sin especificar", SHEET_PADDING, 83, {
    size: 16,
    weight: "bold",
  });

  // Dates.
  const dateColumn = width * 0.53;

  addText(header, "FECHA DE PEDIDO", dateColumn, 63, {
    size: 10,
    weight: "bold",
    fill: MUTED,
  });

  addText(header, formatDate(order.orderDate), dateColumn, 83, { size: 14 });

  addText(header, "FECHA DE ENTREGA", right, 63, {
    size: 10,
    weight: "bold",
    fill: MUTED,
    anchor: "end",
  });

  // Fecha de entrega: negrita y rojo (el mismo rojo de las cotas).
  addText(header, formatDate(order.deliveryDate), right, 83, {
    size: 16,
    weight: "bold",
    fill: ALERT,
    anchor: "end",
  });

  addText(header, productLabel, SHEET_PADDING, 113, {
    size: 13,
    weight: "bold",
    fill: MUTED,
  });

  header.appendChild(
    svgElement("line", {
      x1: String(SHEET_PADDING),
      x2: String(right),
      y1: "124",
      y2: "124",
      stroke: RULE,
      "stroke-width": "1",
    })
  );

  // Footer.
  const footer = svgElement("g");

  footer.appendChild(
    svgElement("line", {
      x1: String(SHEET_PADDING),
      x2: String(right),
      y1: String(footerY + 12),
      y2: String(footerY + 12),
      stroke: RULE,
      "stroke-width": "1",
    })
  );

  addText(footer, "NOTAS / OBSERVACIONES", SHEET_PADDING, footerY + 32, {
    size: 11,
    weight: "bold",
    fill: MUTED,
  });

  notesLines.forEach((line, index) => {
    if (line) {
      addText(footer, line, SHEET_PADDING, notesStartY + index * NOTES_LINE, {
        size: 13,
      });
    }
  });

  addText(footer, "ORSAL · Documento de fabricación", SHEET_PADDING, creditY, {
    size: 10,
    fill: FAINT,
  });

  // Reassemble the SVG.
  clone.replaceChildren(...preserved, background, drawing, header, footer);

  return clone;
}

const CSS = `
.ov {
  max-width:1280px;
  margin:0 auto;
  padding:24px 20px 56px;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif
}
.ov h1 {font-size:22px;font-weight:650;margin:0 0 4px}
.ov .sub {opacity:.7;margin:0 0 20px;font-size:14px}
.ov-grid {
  display:grid;
  grid-template-columns:340px minmax(0,1fr);
  gap:28px;
  align-items:start
}
@media(max-width:920px) {
  .ov-grid {grid-template-columns:1fr}
}
.ov-panel {display:flex;flex-direction:column;gap:18px}
.ov label.sel {
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:13px;
  font-weight:600
}
.ov fieldset label.sel {margin-top:12px}
.ov select,.ov input,.ov textarea {
  font:inherit;
  color:inherit;
  background:transparent;
  border:1px solid rgba(128,128,128,.45);
  border-radius:6px;
  padding:7px 9px;
  box-sizing:border-box;
  width:100%
}
.ov select {font-size:15px;padding:9px}
.ov textarea {resize:vertical;font-weight:400;font-size:14px}
.ov select:focus-visible,
.ov input:focus-visible,
.ov textarea:focus-visible,
.ov button:focus-visible {
  outline:2px solid #2f5597;
  outline-offset:1px
}
.ov fieldset {
  border:1px solid rgba(128,128,128,.35);
  border-radius:8px;
  padding:4px 14px 14px;
  margin:0;
  min-width:0
}
.ov legend {font-size:13px;font-weight:650;padding:0 6px}
.ov .row {
  display:grid;
  grid-template-columns:1fr 104px;
  gap:8px;
  align-items:center;
  margin-top:8px
}
.ov .row span.l {font-size:13px;line-height:1.25}
.ov .row small {display:block;opacity:.6;font-size:11px}
.ov .row input {text-align:right}
.ov .row input.client {background:rgba(255,235,0,.18)}
.ov .row input.bad {border-color:#b3261e}
.ov .sheet {
  border:1px solid rgba(128,128,128,.35);
  border-radius:8px;
  overflow:hidden;
  background:#fff
}
.ov .sheetbar {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  margin:0 0 10px
}
.ov .sheetbar h2 {font-size:16px;margin:0;font-weight:650}
.ov button {
  font:inherit;
  font-size:13px;
  color:inherit;
  background:transparent;
  border:1px solid rgba(128,128,128,.5);
  border-radius:6px;
  padding:7px 12px;
  cursor:pointer
}
.ov button:hover {background:rgba(128,128,128,.12)}
.ov button:disabled {opacity:.4;cursor:not-allowed}
.ov .strips {display:grid;gap:10px;margin-top:12px}
.ov .warn {
  border:1px solid #b3261e;
  border-radius:8px;
  padding:14px 16px;
  font-size:14px;
  color:#b3261e;
  background:rgba(179,38,30,.08)
}
.ov .status {
  display:inline-block;
  font-size:12px;
  font-weight:650;
  padding:3px 9px;
  border-radius:99px
}
.ov .status.ok {background:rgba(46,125,50,.16);color:#2e7d32}
.ov .status.bad {background:rgba(179,38,30,.14);color:#b3261e}
.ov table {
  width:100%;
  border-collapse:collapse;
  margin-top:16px;
  font-size:14px
}
.ov td {
  padding:7px 4px;
  border-bottom:1px solid rgba(128,128,128,.25)
}
.ov td.n {
  text-align:right;
  font-variant-numeric:tabular-nums;
  white-space:nowrap
}
.ov td.u {width:34px;opacity:.6;font-size:12px}
.ov tr.main td {font-weight:650}
.ov .legend {
  display:flex;
  gap:16px;
  flex-wrap:wrap;
  font-size:12px;
  opacity:.75;
  margin-top:10px
}
.ov .legend i {
  display:inline-block;
  width:12px;
  height:12px;
  border:1px solid #1d2733;
  vertical-align:-2px;
  margin-right:5px
}
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
      onChange={(e) =>
        onChange(e.target.value === "" ? NaN : Number(e.target.value))
      }
    />
  );
}

export default function ProductVisualizerPage() {
  // La fecha de hoy se pone tras montar: en el servidor y en el cliente "hoy"
  // puede ser distinto (zona horaria) y eso provocaría un error de hidratación.
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

  const buildSvgPayload = () => {
  const original = wrapRef.current?.querySelector("svg");
  if (!original) return null;

  const enriched = enrichSvg(original, product.label, order);
  const xml = new XMLSerializer().serializeToString(enriched);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });

  const safeCustomer = order.customerName
    .trim()
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "-")
    .replace(/^-|-$/g, "");

  const filename =
    [product.id, safeCustomer, order.orderDate || "pedido"]
      .filter(Boolean)
      .join("-") + ".svg";

  return { blob, filename };
};

  const downloadSvg = () => {
    const payload = buildSvgPayload();
    if (!payload) return;

    const url = URL.createObjectURL(payload.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = payload.filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

    const shareSvg = async () => {
      const payload = buildSvgPayload();
      if (!payload) return;

      const file = new File([payload.blob], payload.filename, {
        type: "image/svg+xml",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Diseño ${product.label}`,
            text: `Plano SVG para ${order.customerName || "pedido"}.`,
            files: [file],
          });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          console.error("Error al compartir:", error);
        }
      }

      // Fallback for desktop browsers that don't support file sharing
      downloadSvg();
    };

  return (
    <main className="ov">
      <style>{CSS}</style>

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

              <button type="button" onClick={shareSvg} disabled={!canDraw}>
                Compartir SVG
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