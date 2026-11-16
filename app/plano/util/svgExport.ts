import { formatDate } from "./dateHelpers";
import type { OrderMetadata } from "./orderTypes";

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

  addText(
    header,
    order.customerName.trim() || "Sin especificar",
    SHEET_PADDING,
    83,
    { size: 16, weight: "bold" }
  );

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

  clone.replaceChildren(...preserved, background, drawing, header, footer);

  return clone;
}

async function buildPngPayload(
  container: HTMLElement | null,
  productId: string,
  productLabel: string,
  order: OrderMetadata,
  scale = 2 // 2x para que los textos y cotas se vean nítidos al hacer zoom
): Promise<{ blob: Blob; filename: string } | null> {
  const original = container?.querySelector("svg");
  if (!original) return null;

  const enriched = enrichSvg(original, productLabel, order);
  const width = Number(enriched.getAttribute("width")) || 800;
  const height = Number(enriched.getAttribute("height")) || 600;

  // Asegurar namespace XML válido para que <img> lo cargue sin errores
  if (!enriched.getAttribute("xmlns")) {
    enriched.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  const xml = new XMLSerializer().serializeToString(enriched);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fondo blanco explícito (evita transparencias negras en algunos visores)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/png")
    );

    if (!pngBlob) return null;

    const safeCustomer = order.customerName
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "-")
      .replace(/^-|-$/g, "");

    const filename =
      [productId, safeCustomer, order.orderDate || "pedido"]
        .filter(Boolean)
        .join("-") + ".png";

    return { blob: pngBlob, filename };
  } finally {
    URL.revokeObjectURL(svgUrl);
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

export async function shareOrDownloadImage(
  container: HTMLElement | null,
  productId: string,
  productLabel: string,
  order: OrderMetadata
) {
  const payload = await buildPngPayload(
    container,
    productId,
    productLabel,
    order
  );
  if (!payload) return;

  const file = new File([payload.blob], payload.filename, {
    type: "image/png",
  });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Diseño ${productLabel}`,
        text: `Plano técnico para ${order.customerName || "pedido"}.`,
        files: [file],
      });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Error al compartir:", error);
    }
  }

  // Fallback en escritorio si el navegador no soporta compartir archivos
  downloadBlob(payload.blob, payload.filename);
}