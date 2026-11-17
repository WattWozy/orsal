import type { ProductDefinition } from "@/domain/models/product";

// Reusing shared domain door fields and helpers if available, or defining inline
const doorClient = [
  { key: "W", label: "Ancho de hueco", hint: "Luz libre" },
  { key: "H", label: "Alto de hueco" },
];

const doorHeightsOutputs = [
  { key: "ah", label: "Alto de hoja", unit: "mm" },
  { key: "esp", label: "Espacio lateral necesario", unit: "mm" },
];

export const corredera1Definition: ProductDefinition = {
  id: "corredera-1",
  family: "Puertas",
  label: "Corredera 1 hoja",
  client: doorClient,
  margins: [
    { key: "sp", label: "Solape sobre pilar de cierre" },
    { key: "cola", label: "Cola / contrapeso (voladizo)", hint: "0 si va sobre carril" },
    { key: "hi", label: "Holgura inferior (suelo)" },
    { key: "hs", label: "Holgura superior" },
    { key: "ml", label: "Margen lateral de apertura" },
  ],
  defaults: { W: 4000, H: 2000, sp: 150, cola: 0, hi: 50, hs: 30, ml: 100 },
  compute: (v) => {
    const wh = v.W + v.sp + v.cola;
    return { wh, ah: v.H - v.hi - v.hs, esp: wh + v.ml };
  },
  outputs: [
    { key: "wh", label: "Largo de hoja", unit: "mm", main: true },
    ...doorHeightsOutputs,
  ],
  checks: ["wh", "ah"],
  strips: (v, o) => [
    {
      title: "Largo de hoja (esquema, no a escala)",
      segs: [
        { label: "Cola", mm: v.cola, kind: "holgura" },
        { label: "Hueco libre", mm: v.W, kind: "hoja" },
        { label: "Solape pilar", mm: v.sp, kind: "holgura" },
      ],
    },
    {
      title: "Alturas",
      segs: [
        { label: "Holgura inf.", mm: v.hi, kind: "holgura" },
        { label: "Hoja", mm: o.ah, kind: "hoja" },
        { label: "Holgura sup.", mm: v.hs, kind: "holgura" },
      ],
    },
  ],
};