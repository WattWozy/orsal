import type { ReactElement } from "react";
import type { Product, Values, Field, OutRow, Strip } from "../lib/types";
import { fmt, makeScene, Svg, HDim, VDim, Ground } from "../lib/scene";

/** Vallas rígidas: enmarcada y sin marco. */

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

function RigidDrawing({ v, o, framed }: { v: Values; o: Values; framed: boolean }) {
  const sc = makeScene(0, v.L, v.H, v.e, 3, 2, 3);
  const { X, Y, s } = sc;
  const n = o.n;
  const posts: ReactElement[] = [];
  const panels: ReactElement[] = [];
  for (let i = 0; i <= n; i++) {
    const x = i * o.pitch;
    posts.push(
      <g key={"p" + i}>
        <rect className="out" x={X(x)} y={Y(v.H)} width={v.p * s} height={v.H * s} />
        <rect className="bury" x={X(x)} y={Y(0)} width={v.p * s} height={v.e * s} />
      </g>
    );
  }
  for (let i = 0; i < n; i++) {
    const x = i * o.pitch + v.p + v.h;
    if (framed) {
      const iw = Math.max(0, o.wp - 2 * v.m);
      const ih = Math.max(0, o.hp - 2 * v.m);
      panels.push(
        <g key={"a" + i}>
          <rect className="frame" x={X(x)} y={Y(v.H)} width={o.wp * s} height={o.hp * s} />
          <rect className="mesh" x={X(x + v.m)} y={Y(v.H - v.m)} width={iw * s} height={ih * s} />
        </g>
      );
    } else {
      panels.push(<rect key={"a" + i} className="mesh" x={X(x)} y={Y(v.H)} width={o.wp * s} height={o.hp * s} />);
    }
  }
  const lastPanelRight = v.L - v.p - v.h;
  return (
    <Svg sc={sc}>
      <Ground x1={X(0) - 14} x2={X(v.L) + 14} y={Y(0)} />
      {posts}
      {panels}
      {/* cotas superiores: de menor a mayor */}
      <HDim x1={X(v.p + v.h)} x2={X(v.p + v.h + o.wp)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wp)} (panel)`} />
      <HDim x1={X(v.p / 2)} x2={X(v.p / 2 + o.pitch)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.pitch)} (eje–eje)`} />
      <HDim x1={X(0)} x2={X(v.L)} y={sc.top(2)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.L)} (tramo)`} />
      {/* cotas izquierdas */}
      <VDim side="left" x={sc.left(0)} y1={Y(v.H)} y2={Y(v.s)} f={X(0)} label={`${fmt(o.hp)} (panel)`} />
      <VDim side="left" x={sc.left(1)} y1={Y(v.H)} y2={Y(0)} f={X(0)} label={fmt(v.H)} />
      {/* cotas derechas */}
      <VDim side="right" x={sc.right(0)} y1={Y(v.s)} y2={Y(0)} f={X(lastPanelRight)} label={fmt(v.s)} narrow="up" />
      <VDim side="right" x={sc.right(1)} y1={Y(0)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(v.e)} (anclaje)`} />
      <VDim side="right" x={sc.right(2)} y1={Y(v.H)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(o.hpo)} (poste)`} />
    </Svg>
  );
}

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

const rigidOutputs = (framed: boolean): OutRow[] => [
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
      ] as OutRow[])
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

export const rigidaEnmarcada: Product = {
  id: "rigida-enmarcada",
  family: "Vallas",
  label: "Rígida enmarcada",
  client: rigidClient,
  margins: rigidMargins(true),
  defaults: { L: 12000, H: 2000, wmax: 2500, p: 60, h: 10, s: 50, e: 600, m: 40 },
  compute: rigidCompute(true),
  outputs: rigidOutputs(true),
  checks: ["wp", "hp", "wi", "hi"],
  Drawing: ({ v, o }) => <RigidDrawing v={v} o={o} framed />,
  strips: rigidStrips(true),
};

export const rigidaSinMarco: Product = {
  id: "rigida-sin-marco",
  family: "Vallas",
  label: "Rígida no enmarcada",
  client: rigidClient,
  margins: rigidMargins(false),
  defaults: { L: 12000, H: 2000, wmax: 2500, p: 60, h: 20, s: 50, e: 600 },
  compute: rigidCompute(false),
  outputs: rigidOutputs(false),
  checks: ["wp", "hp"],
  Drawing: ({ v, o }) => <RigidDrawing v={v} o={o} framed={false} />,
  strips: rigidStrips(false),
};