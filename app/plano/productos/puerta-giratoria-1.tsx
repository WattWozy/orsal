import type { Product, Values, Field } from "../lib/types";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "../lib/scene";
import { PW, DoorHeights, heightsStrip, doorHeightsOutputs, doorClient } from "../lib/puertas";

/** Puerta giratoria de 1 hoja. */

/* ---- Giratoria 1 hoja ---- */
function Swing1Drawing({ v, o }: { v: Values; o: Values }) {
  const sc = makeScene(-PW, v.W + PW, v.H, 0, 2, 0, 2);
  const { X, Y, s } = sc;
  const xr = v.W - v.hc;
  return (
    <Svg sc={sc}>
      <Ground x1={X(-PW) - 14} x2={X(v.W + PW) + 14} y={Y(0)} />
      <rect className="out" x={X(-PW)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <rect className="out" x={X(v.W)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <Leaf sc={sc} x1={v.hb} x2={xr} y1={v.hi} y2={v.H - v.hs} hinge="left" handle="right" />
      <HDim x1={X(0)} x2={X(v.hb)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.hb)} narrow="left" />
      <HDim x1={X(v.hb)} x2={X(xr)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wh)} (hoja)`} />
      <HDim x1={X(xr)} x2={X(v.W)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.hc)} narrow="right" />
      <HDim x1={X(0)} x2={X(v.W)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.W)} (hueco)`} />
      <DoorHeights sc={sc} v={v} o={o} fx={X(xr)} />
    </Svg>
  );
}

const swingMargins1: Field[] = [
  { key: "hb", label: "Holgura lado bisagras" },
  { key: "hc", label: "Holgura lado cierre" },
  { key: "hi", label: "Holgura inferior (suelo)" },
  { key: "hs", label: "Holgura superior" },
];

export const giratoria1: Product = {
  id: "giratoria-1",
  family: "Puertas",
  label: "Giratoria 1 hoja",
  client: doorClient,
  margins: swingMargins1,
  defaults: { W: 1200, H: 2000, hb: 15, hc: 20, hi: 80, hs: 20 },
  compute: (v) => ({ wh: v.W - v.hb - v.hc, ah: v.H - v.hi - v.hs }),
  outputs: [{ key: "wh", label: "Ancho de hoja", unit: "mm", main: true }, ...doorHeightsOutputs],
  checks: ["wh", "ah"],
  Drawing: Swing1Drawing,
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
    heightsStrip(v, o),
  ],
};