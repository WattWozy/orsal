import type { ProductDefinition, Field } from "@/domain/models/product";

const doorClient: Field[] = [
  { key: "W", label: "Ancho de hueco", hint: "Luz libre" },
  { key: "H", label: "Alto de hueco" },
];

const doorHeightsOutputs = [
  { key: "ah", label: "Alto de hoja", unit: "mm" },
];

const swingMargins1: Field[] = [
  { key: "hb", label: "Holgura lado bisagras" },
  { key: "hc", label: "Holgura lado cierre" },
  { key: "hi", label: "Holgura inferior (suelo)" },
  { key: "hs", label: "Holgura superior" },
];

export const giratoria1Definition: ProductDefinition = {
  id: "giratoria-1",
  family: "Puertas",
  label: "Giratoria 1 hoja",
  client: doorClient,
  margins: swingMargins1,
  defaults: { W: 1200, H: 2000, hb: 15, hc: 20, hi: 80, hs: 20 },
  compute: (v) => ({ wh: v.W - v.hb - v.hc, ah: v.H - v.hi - v.hs }),
  outputs: [
    { key: "wh", label: "Ancho de hoja", unit: "mm", main: true },
    ...doorHeightsOutputs,
  ],
  checks: ["wh", "ah"],
  strips: (v, o) => [
    {
      title: "Holguras en horizontal (esquema, no a escala)",
      segs: [
        { label: "Pilar", mm: null, kind: "pilar" },
        { label: "Bisagras", mm: v.hb, kind: "holgura" },
        { label: "Hoja", mm: o.wh, kind: "hoja" },
        { label: "Cierre", mm: v.hc, kind: "holgura" },
        { label: "Pilar", mm: null, kind: "pilar" },
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