import type { ProductDefinition, Values, Field, OutputField, Strip } from "@/domain/models/product";

const rigidCompute =
  (framed: boolean) =>
  (v: Values): Values => {
    const den = v.wmax + 2 * v.h + v.p;
    const nRaw = Math.ceil((v.L - v.p) / den);
    const n = Number.isFinite(nRaw) ? Math.max(1, nRaw) : NaN;
    const pitch = (v.L - v.p) / n;
    const vano = pitch - v.p;
    const wp = vano - 2 * v.h;
    const hp = v.H - v.s;
    const o: Values = { n, np: n + 1, pitch, vano, wp, hp, hpo: v.H + v.e };
    if (framed) {
      o.wi = wp - 2 * v.m;
      o.hi = hp - 2 * v.m;
    }
    return o;
  };

const rigidStrips =
  (framed: boolean) =>
  (v: Values, o: Values): Strip[] => [
    {
      title: "Holguras en horizontal (esquema, no a escala)",
      segs: [
        { label: "Poste", mm: v.p, kind: "pilar" },
        { label: "Holgura", mm: v.h, kind: "holgura" },
        { label: framed ? "Panel enmarcado" : "Panel", mm: o.wp, kind: "hoja" },
        { label: "Holgura", mm: v.h, kind: "holgura" },
        { label: "Poste", mm: v.p, kind: "pilar" },
      ],
    },
    {
      title: "Alturas de arriba abajo (esquema, no a escala)",
      segs: [
        { label: "Panel", mm: o.hp, kind: "hoja" },
        { label: "Sep. suelo", mm: v.s, kind: "holgura" },
        { label: "Anclaje poste", mm: v.e, kind: "suelo" },
      ],
    },
  ];

const rigidOutputs = (framed: boolean): OutputField[] => [
  { key: "n", label: "Nº de paneles", unit: "ud" },
  { key: "np", label: "Nº de postes", unit: "ud" },
  { key: "pitch", label: "Distancia entre ejes de postes", unit: "mm" },
  { key: "vano", label: "Vano libre entre postes", unit: "mm" },
  { key: "wp", label: "Ancho de panel", unit: "mm", main: true },
  { key: "hp", label: "Alto de panel", unit: "mm", main: true },
  { key: "hpo", label: "Largo total del poste", unit: "mm" },
  ...(framed
    ? ([
        { key: "wi", label: "Ancho interior de malla", unit: "mm" },
        { key: "hi", label: "Alto interior de malla", unit: "mm" },
      ] as OutputField[])
    : []),
];

const rigidClient: Field[] = [
  { key: "L", label: "Longitud total del tramo", hint: "exterior a exterior de postes" },
  { key: "H", label: "Altura total visible" },
  { key: "wmax", label: "Ancho máximo de panel" },
];

const rigidMargins = (framed: boolean): Field[] => [
  { key: "p", label: "Ancho del poste" },
  { key: "h", label: "Holgura panel–poste (por lado)" },
  { key: "s", label: "Separación al suelo" },
  { key: "e", label: "Anclaje del poste" },
  ...(framed ? [{ key: "m", label: "Perfil del marco (por lado)" }] : []),
];

export const rigidaEnmarcadaDefinition: ProductDefinition = {
  id: "rigida-enmarcada",
  family: "Vallas",
  label: "Rígida enmarcada",
  client: rigidClient,
  margins: rigidMargins(true),
  defaults: { L: 12000, H: 2000, wmax: 2500, p: 60, h: 10, s: 50, e: 600, m: 40 },
  compute: rigidCompute(true),
  outputs: rigidOutputs(true),
  checks: ["wp", "hp", "wi", "hi"],
  strips: rigidStrips(true),
};

export const rigidaSinMarcoDefinition: ProductDefinition = {
  id: "rigida-sin-marco",
  family: "Vallas",
  label: "Rígida no enmarcada",
  client: rigidClient,
  margins: rigidMargins(false),
  defaults: { L: 12000, H: 2000, wmax: 2500, p: 60, h: 20, s: 50, e: 600 },
  compute: rigidCompute(false),
  outputs: rigidOutputs(false),
  checks: ["wp", "hp"],
  strips: rigidStrips(false),
};