import type { ProductDefinition, Field, OutputField, Strip } from "@/domain/models/product";

const doorClient: Field[] = [
  { key: "W", label: "Ancho de hueco", hint: "Luz libre" },
  { key: "H", label: "Alto de hueco" },
];

const doorHeightsOutputs: OutputField[] = [
  { key: "ah", label: "Alto de hoja", unit: "mm" },
  { key: "esp", label: "Espacio lateral necesario", unit: "mm" },
];

export const corredera2Definition: ProductDefinition = {
  id: "corredera-2",
  family: "Puertas",
  label: "Corredera 2 hojas",
  client: doorClient,
  margins: [
    { key: "sp", label: "Solape sobre cada pilar" },
    { key: "sc", label: "Solape central entre hojas", hint: "negativo = separación" },
    { key: "hi", label: "Holgura inferior (suelo)" },
    { key: "hs", label: "Holgura superior" },
    { key: "ml", label: "Margen lateral de apertura" },
  ],
  defaults: { W: 6000, H: 2000, sp: 150, sc: 50, hi: 50, hs: 30, ml: 100 },
  compute: (v) => {
    const wh = (v.W + 2 * v.sp + v.sc) / 2;
    return { wh, ah: v.H - v.hi - v.hs, esp: wh + v.ml };
  },
  outputs: [
    { key: "wh", label: "Largo de cada hoja", unit: "mm", main: true },
    ...doorHeightsOutputs,
    { key: "esp", label: "Espacio lateral necesario por lado", unit: "mm" },
  ],
  checks: ["wh", "ah"],
  strips: (v, o): Strip[] => [
    {
      title: "Hueco y solapes (esquema, no a escala)",
      segs: [
        { label: "Solape pilar", mm: v.sp, kind: "holgura" },
        { label: "Medio hueco", mm: v.W / 2, kind: "hoja" },
        { label: "Solape central", mm: Math.abs(v.sc), kind: "holgura" },
        { label: "Medio hueco", mm: v.W / 2, kind: "hoja" },
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