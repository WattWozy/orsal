import type { ProductDefinition, Field, OutputField, Strip } from "@/domain/models/product";

const doorClient: Field[] = [
  { key: "W", label: "Ancho de hueco", hint: "Luz libre" },
  { key: "H", label: "Alto de hueco" },
];

const doorHeightsOutputs: OutputField[] = [
  { key: "ah", label: "Alto de hoja", unit: "mm" },
];

export const giratoria2Definition: ProductDefinition = {
  id: "giratoria-2",
  family: "Puertas",
  label: "Giratoria 2 hojas",
  client: doorClient,
  margins: [
    { key: "hb", label: "Holgura lado bisagras (por lado)" },
    { key: "hc", label: "Holgura central entre hojas" },
    { key: "hi", label: "Holgura inferior (suelo)" },
    { key: "hs", label: "Holgura superior" },
  ],
  defaults: { W: 3000, H: 2000, hb: 15, hc: 30, hi: 80, hs: 20 },
  compute: (v) => ({ wh: (v.W - 2 * v.hb - v.hc) / 2, ah: v.H - v.hi - v.hs }),
  outputs: [
    { key: "wh", label: "Ancho de cada hoja", unit: "mm", main: true },
    ...doorHeightsOutputs,
  ],
  checks: ["wh", "ah"],
  strips: (v, o): Strip[] => [
    {
      title: "Holguras en horizontal (esquema, no a escala)",
      segs: [
        { label: "Pilar", mm: null, kind: "pilar" },
        { label: "Bisagras", mm: v.hb, kind: "holgura" },
        { label: "Hoja", mm: o.wh, kind: "hoja" },
        { label: "Central", mm: v.hc, kind: "holgura" },
        { label: "Hoja", mm: o.wh, kind: "hoja" },
        { label: "Bisagras", mm: v.hb, kind: "holgura" },
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