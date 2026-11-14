import type { ReactElement } from "react";
import type { Product, Values, Field, OutRow, Strip } from "../lib/types";
import { fmt, makeScene, Svg, HDim, VDim, Ground } from "../lib/scene";

/** Vallas no rígidas: simple torsión, triple torsión, anudada y otra. Misma lógica, distinta etiqueta. */

const flexCompute = (v: Values): Values => {
  const vanos = Math.max(1, Math.ceil(v.L / v.dmax));
  const lm = v.L + 2 * v.rem;
  const nr = Math.ceil(lm / v.roll);
  return {
    hm: v.H - v.s,
    lm,
    nr,
    sob: nr * v.roll - lm,
    v: vanos,
    pi: vanos - 1,
    pt: vanos + 1,
    sep: v.L / vanos,
    hpo: v.H + v.e,
    al: v.hil * v.L,
  };
};

function FlexDrawing({ v, o }: { v: Values; o: Values }) {
  const pw = 60; // ancho visual del poste
  const sc = makeScene(-pw / 2, v.L + pw / 2, v.H, v.e, 2, 2, 3);
  const { X, Y, s } = sc;
  const posts: ReactElement[] = [];
  for (let i = 0; i <= o.v; i++) {
    const x = i * o.sep - pw / 2;
    posts.push(
      <g key={i}>
        <rect className="out" x={X(x)} y={Y(v.H)} width={pw * s} height={v.H * s} />
        <rect className="bury" x={X(x)} y={Y(0)} width={pw * s} height={v.e * s} />
      </g>
    );
  }
  const wires: ReactElement[] = [];
  const nh = Math.min(Math.max(0, Math.round(v.hil)), 12);
  for (let k = 0; k < nh; k++) {
    const frac = nh === 1 ? 0.5 : k / (nh - 1);
    const yy = v.s + 40 + (o.hm - 80) * frac;
    wires.push(<line key={k} className="wire" x1={X(0)} x2={X(v.L)} y1={Y(yy)} y2={Y(yy)} />);
  }
  return (
    <Svg sc={sc}>
      <Ground x1={X(-pw / 2) - 14} x2={X(v.L + pw / 2) + 14} y={Y(0)} />
      <rect className="mesh" x={X(0)} y={Y(v.H)} width={v.L * s} height={o.hm * s} />
      {wires}
      {posts}
      <HDim x1={X(0)} x2={X(o.sep)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.sep)} (eje–eje)`} />
      <HDim x1={X(0)} x2={X(v.L)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.L)} (tramo)`} />
      <VDim side="left" x={sc.left(0)} y1={Y(v.H)} y2={Y(v.s)} f={X(0)} label={`${fmt(o.hm)} (malla)`} />
      <VDim side="left" x={sc.left(1)} y1={Y(v.H)} y2={Y(0)} f={X(0)} label={fmt(v.H)} />
      <VDim side="right" x={sc.right(0)} y1={Y(v.s)} y2={Y(0)} f={X(v.L)} label={fmt(v.s)} narrow="up" />
      <VDim side="right" x={sc.right(1)} y1={Y(0)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(v.e)} (anclaje)`} />
      <VDim side="right" x={sc.right(2)} y1={Y(v.H)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(o.hpo)} (poste)`} />
    </Svg>
  );
}

const flexStrips = (v: Values, o: Values): Strip[] => [
  {
    title: "Malla en horizontal (esquema, no a escala)",
    segs: [
      { label: "Remate", mm: v.rem, kind: "holgura" },
      { label: "Tramo", mm: v.L, kind: "hoja" },
      { label: "Remate", mm: v.rem, kind: "holgura" },
    ],
  },
  {
    title: "Alturas de arriba abajo (esquema, no a escala)",
    segs: [
      { label: "Malla", mm: o.hm, kind: "hoja" },
      { label: "Sep. suelo", mm: v.s, kind: "holgura" },
      { label: "Anclaje poste", mm: v.e, kind: "suelo" },
    ],
  },
];

const flexClient: Field[] = [
  { key: "L", label: "Longitud total del tramo" },
  { key: "H", label: "Altura total visible" },
];
const flexMargins: Field[] = [
  { key: "s", label: "Separación al suelo" },
  { key: "rem", label: "Sobrante de malla por extremo" },
  { key: "dmax", label: "Separación máxima entre postes" },
  { key: "roll", label: "Longitud del rollo" },
  { key: "hil", label: "Nº de hilos tensores", hint: "ud" },
  { key: "e", label: "Anclaje del poste" },
];
const flexOutputs: OutRow[] = [
  { key: "hm", label: "Altura de malla", unit: "mm", main: true },
  { key: "lm", label: "Longitud de malla necesaria", unit: "mm", main: true },
  { key: "nr", label: "Nº de rollos", unit: "ud" },
  { key: "sob", label: "Sobrante de malla", unit: "mm" },
  { key: "v", label: "Nº de vanos", unit: "ud" },
  { key: "pi", label: "Postes intermedios", unit: "ud" },
  { key: "pt", label: "Postes totales (con extremos)", unit: "ud" },
  { key: "sep", label: "Separación real entre ejes", unit: "mm" },
  { key: "hpo", label: "Largo total del poste", unit: "mm" },
  { key: "al", label: "Alambre tensor total", unit: "mm" },
];
const flexDefaults: Values = { L: 25000, H: 1500, s: 50, rem: 300, dmax: 3000, roll: 25000, hil: 3, e: 600 };

function flexProduct(id: string, label: string): Product {
  return {
    id,
    family: "Vallas",
    label,
    client: flexClient,
    margins: flexMargins,
    defaults: flexDefaults,
    compute: flexCompute,
    outputs: flexOutputs,
    checks: ["hm", "lm", "v"],
    Drawing: FlexDrawing,
    strips: flexStrips,
  };
}

export const vallasFlexibles: Product[] = [
  flexProduct("simple-torsion", "Simple torsión"),
  flexProduct("triple-torsion", "Triple torsión"),
  flexProduct("anudada", "Anudada"),
  flexProduct("otro", "Otra no rígida"),
];