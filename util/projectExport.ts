import type { ProductDefinition, Values } from "@/domain/models/product";
import type { EvaluationResult } from "@/domain/calculations/evaluateProduct";
import { fmt } from "@/lib/scene";
import type { OrderMetadata } from "./orderTypes";
import {
  HEADER_HEIGHT, SHEET_PADDING, MUTED, RULE, ALERT, INK,
  svgElement, addText, wrapText, buildHeader, buildFooter,
  svgToPngBlob, shareOrDownloadBlob,
} from "./svgExport";

export type ExportLine = {
  product: ProductDefinition;
  values: Values;
  quantity: number;
  evaluation: EvaluationResult;
  drawing: SVGSVGElement | null; // null if it can't be drawn
};

const WIDTH = 1000;
const THUMB_W = 380;
const THUMB_MAX_H = 240;
const ROW_PAD = 16;
const LINE_H = 17;
const TEXT_X = SHEET_PADDING + THUMB_W + 24;

export function buildProjectSvg(lines: ExportLine[], order: OrderMetadata): SVGSVGElement {
  const right = WIDTH - SHEET_PADDING;
  const units = lines.reduce((n, l) => n + l.quantity, 0);
  const body = svgElement("g");
  let y = HEADER_HEIGHT;

  lines.forEach((line, i) => {
    const { product, values, quantity, evaluation, drawing } = line;

    // --- thumbnail size
    let thumbH = 110;
    if (drawing) {
      const [, , w, h] = (drawing.getAttribute("viewBox") ?? "0 0 1000 400")
        .split(/\s+/).map(Number);
      thumbH = Math.min((THUMB_W * h) / w, THUMB_MAX_H);
    }

    // --- text column (cursor-based so row height adapts)
    let ty = y + ROW_PAD + 14;
    const family = product.family === "Vallas" ? "Valla" : "Puerta";
    addText(body, `${i + 1}. ${family} · ${product.label}`, TEXT_X, ty, { size: 15, weight: "bold" });
    addText(body, `× ${quantity}`, right, ty + 4, { size: 24, weight: "bold", anchor: "end" });
    ty += 8;

    const maxChars = Math.floor((right - TEXT_X) / 6.4);
    const groups: Array<[string, typeof product.client]> = [
      ["Cliente", product.client],
      ["Holguras", product.margins],
    ];
    for (const [name, fields] of groups) {
      const text = `${name}: ` + fields.map((f) => `${f.label} ${fmt(values[f.key])}`).join(" · ");
      wrapText(text, maxChars).forEach((l) => {
        ty += LINE_H;
        addText(body, l, TEXT_X, ty, { size: 11, fill: MUTED });
      });
    }
    ty += 8;

    if (!evaluation.checksOk) {
      ty += LINE_H;
      addText(body, "⚠ Revisar medidas", TEXT_X, ty, { size: 12, weight: "bold", fill: ALERT });
    } else {
      product.outputs.forEach((r) => {
        ty += LINE_H;
        const weight = r.main ? "bold" : "normal";
        addText(body, r.label, TEXT_X, ty, { size: 12, weight, fill: r.main ? INK : MUTED });
        addText(body, fmt(evaluation.outputs[r.key]), right - 48, ty, { size: 12, weight, anchor: "end" });
        addText(body, r.unit, right - 42, ty, { size: 11, fill: MUTED });
      });
    }

    const rowH = Math.max(thumbH, ty - y - ROW_PAD) + 2 * ROW_PAD;

    // --- thumbnail
    const thumbY = y + ROW_PAD;
    body.appendChild(
      svgElement("rect", {
        x: String(SHEET_PADDING), y: String(thumbY),
        width: String(THUMB_W), height: String(thumbH),
        fill: "#ffffff", stroke: RULE, "stroke-width": "1",
      })
    );
    if (drawing) {
      drawing.setAttribute("x", String(SHEET_PADDING));
      drawing.setAttribute("y", String(thumbY));
      drawing.setAttribute("width", String(THUMB_W));
      drawing.setAttribute("height", String(thumbH));
      drawing.setAttribute("preserveAspectRatio", "xMidYMid meet");
      body.appendChild(drawing);
    } else {
      addText(body, "Sin plano", SHEET_PADDING + THUMB_W / 2, thumbY + thumbH / 2, {
        size: 12, fill: MUTED, anchor: "middle",
      });
    }

    // --- row separator
    y += rowH;
    body.appendChild(
      svgElement("line", {
        x1: String(SHEET_PADDING), x2: String(right),
        y1: String(y), y2: String(y), stroke: RULE, "stroke-width": "1",
      })
    );
  });

  // --- totals
  addText(body, `TOTAL: ${lines.length} ${lines.length === 1 ? "línea" : "líneas"} · ${units} ${units === 1 ? "unidad" : "unidades"}`,
    right, y + 28, { size: 14, weight: "bold", anchor: "end" });
  y += 44;

  const header = buildHeader(WIDTH, order, "Resumen de productos del proyecto", "RESUMEN DE PROYECTO");
  const footer = buildFooter(WIDTH, y, order.notes);
  const totalHeight = Math.ceil(y + footer.height);

  const svg = svgElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${WIDTH} ${totalHeight}`,
    width: String(WIDTH),
    height: String(totalHeight),
  });
  svg.appendChild(svgElement("rect", { x: "0", y: "0", width: String(WIDTH), height: String(totalHeight), fill: "#ffffff" }));
  svg.append(header, body, footer.g);
  return svg;
}

export async function shareOrDownloadProject(lines: ExportLine[], order: OrderMetadata) {
  if (lines.length === 0) return;

  const blob = await svgToPngBlob(buildProjectSvg(lines, order));
  if (!blob) return;

  const safeCustomer = order.customerName.trim()
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "-").replace(/^-|-$/g, "");
  const filename = ["proyecto", safeCustomer, order.orderDate || "pedido"]
    .filter(Boolean).join("-") + ".png";

  await shareOrDownloadBlob(
    blob, filename,
    "Resumen de proyecto",
    `Resumen de pedido para ${order.customerName || "cliente"}.`
  );
}