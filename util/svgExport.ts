import { formatDate } from "./dateHelpers";
import type { OrderMetadata } from "./orderTypes";

const SVG_NS = "http://www.w3.org/2000/svg";

/* Hoja de pedido: medidas y paleta (misma que el dibujo para que no desentone) */
export const HEADER_HEIGHT = 132;
export const SHEET_PADDING = 28;
export const NOTES_LINE = 18;
export const INK = "#1d2733";
export const MUTED = "#51606f";
export const FAINT = "#7a8794";
export const RULE = "#b8c0c8";
export const ALERT = "#b3261e"; // mismo rojo que las cotas

export function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {}
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

export function addText(
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
export function wrapText(value: string, maxChars: number): string[] {
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
export function enrichSvg(
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

  const footerY = HEADER_HEIGHT + originalHeight;
  const footer = buildFooter(width, footerY, order.notes);
  const totalHeight = footerY + footer.height;

  clone.setAttribute("viewBox", `${originalX} 0 ${width} ${totalHeight}`);
  clone.setAttribute("width", String(Math.ceil(width)));
  clone.setAttribute("height", String(Math.ceil(totalHeight)));
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const isStyleOrDefs = (el: Element) =>
    ["style", "defs"].includes(el.tagName.toLowerCase());

  const preserved = Array.from(clone.children).filter(isStyleOrDefs);

  const drawing = svgElement("g", {
    transform: `translate(0 ${HEADER_HEIGHT + originalY})`,
  });
  Array.from(clone.children)
    .filter((el) => !isStyleOrDefs(el))
    .forEach((el) => drawing.appendChild(el));

  const background = svgElement("rect", {
    x: String(originalX),
    y: "0",
    width: String(width),
    height: String(totalHeight),
    fill: "#ffffff",
  });

  const header = buildHeader(width, order, productLabel);

  clone.replaceChildren(...preserved, background, drawing, header, footer.g);
  return clone;
}

export function buildHeader(
  width: number,
  order: OrderMetadata,
  subtitle: string,
  title = "DOCUMENTO TÉCNICO DE PEDIDO"
) {
  const right = width - SHEET_PADDING;
  const header = svgElement("g");

  addText(header, "ORSAL", SHEET_PADDING, 37, { size: 25, weight: "bold" });
  addText(header, title, right, 35, { size: 13, weight: "bold", fill: MUTED, anchor: "end" });

  addText(header, "CLIENTE", SHEET_PADDING, 63, { size: 10, weight: "bold", fill: MUTED });
  addText(header, order.customerName.trim() || "Sin especificar", SHEET_PADDING, 83, { size: 16, weight: "bold" });

  const locationColumn = width * 0.32;
  addText(header, "UBICACIÓN", locationColumn, 63, { size: 10, weight: "bold", fill: MUTED });
  addText(header, order.location.trim() || "Sin especificar", locationColumn, 83, { size: 14, weight: "bold" });

  const dateColumn = width * 0.6;
  addText(header, "FECHA DE PEDIDO", dateColumn, 63, { size: 10, weight: "bold", fill: MUTED });
  addText(header, formatDate(order.orderDate), dateColumn, 83, { size: 14 });

  addText(header, "FECHA DE ENTREGA", right, 63, { size: 10, weight: "bold", fill: MUTED, anchor: "end" });
  addText(header, formatDate(order.deliveryDate), right, 83, { size: 16, weight: "bold", fill: ALERT, anchor: "end" });

  addText(header, subtitle, SHEET_PADDING, 113, { size: 13, weight: "bold", fill: MUTED });

  header.appendChild(
    svgElement("line", {
      x1: String(SHEET_PADDING), x2: String(right),
      y1: "124", y2: "124", stroke: RULE, "stroke-width": "1",
    })
  );
  return header;
}

export function buildFooter(width: number, y: number, notes: string) {
  const right = width - SHEET_PADDING;
  const maxChars = Math.floor((width - 2 * SHEET_PADDING) / 7.2);
  const lines = wrapText(notes, maxChars);
  const notesStartY = y + 53;
  const creditY = notesStartY + (lines.length - 1) * NOTES_LINE + 32;

  const g = svgElement("g");
  g.appendChild(
    svgElement("line", {
      x1: String(SHEET_PADDING), x2: String(right),
      y1: String(y + 12), y2: String(y + 12), stroke: RULE, "stroke-width": "1",
    })
  );
  addText(g, "NOTAS / OBSERVACIONES", SHEET_PADDING, y + 32, { size: 11, weight: "bold", fill: MUTED });
  lines.forEach((line, i) => {
    if (line) addText(g, line, SHEET_PADDING, notesStartY + i * NOTES_LINE, { size: 13 });
  });
  addText(g, "ORSAL · Documento de fabricación", SHEET_PADDING, creditY, { size: 10, fill: FAINT });

  return { g, height: creditY + 16 - y };
}

async function buildPngPayload(
  container: HTMLElement | null,
  productId: string,
  productLabel: string,
  order: OrderMetadata
): Promise<{ blob: Blob; filename: string } | null>{
  const original = container?.querySelector("svg");
  if (!original) return null;

  const blob = await svgToPngBlob(enrichSvg(original, productLabel, order));
  if (!blob) return null;

  const safeCustomer = order.customerName.trim()
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "-").replace(/^-|-$/g, "");
  const filename = [productId, safeCustomer, order.orderDate || "pedido"].filter(Boolean).join("-") + ".png";
  return { blob, filename };
}

export async function shareOrDownloadImage(
  container: HTMLElement | null,
  productId: string,
  productLabel: string,
  order: OrderMetadata
) {
  const payload = await buildPngPayload(container, productId, productLabel, order);
  if (!payload) return;
  await shareOrDownloadBlob(
    payload.blob, payload.filename,
    `Diseño ${productLabel}`,
    `Plano técnico para ${order.customerName || "pedido"}.`
  );
}

export async function svgToPngBlob(svg: SVGSVGElement, maxScale = 2): Promise<Blob | null> {
  const width = Number(svg.getAttribute("width")) || 800;
  const height = Number(svg.getAttribute("height")) || 600;
  if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", SVG_NS);

  // Long projects: cap the canvas area (iOS Safari fails above ~16M px)
  const scale = Math.min(maxScale, Math.sqrt(12_000_000 / (width * height)));

  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareOrDownloadBlob(
  blob: Blob, filename: string, title: string, text: string
) {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title, text, files: [file] });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Error al compartir:", error);
    }
  }
  downloadBlob(blob, filename);
}