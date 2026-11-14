import type { Product, Values } from "../lib/types";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "../lib/scene";
import { PW, DoorHeights, heightsStrip, doorHeightsOutputs, doorClient } from "../lib/puertas";

/** Puerta giratoria de 2 hojas. */

/* ---- Giratoria 2 hojas ---- */
function Swing2Drawing({ v, o }: { v: Values; o: Values }) {
  const sc = makeScene(-PW, v.W + PW, v.H, 0, 2, 0, 2);
  const { X, Y, s } = sc;
  const l1 = v.hb;
  const l2 = v.hb + o.wh;
  const r1 = v.W - v.hb - o.wh;
  const r2 = v.W - v.hb;
  return (
    <Svg sc={sc}>
      <Ground x1={X(-PW) - 14} x2={X(v.W + PW) + 14} y={Y(0)} />
      <rect className="out" x={X(-PW)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <rect className="out" x={X(v.W)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <Leaf sc={sc} x1={l1} x2={l2} y1={v.hi} y2={v.H - v.hs} hinge="left" handle="right" />
      <Leaf sc={sc} x1={r1} x2={r2} y1={v.hi} y2={v.H - v.hs} hinge="right" handle="left" />
      <HDim x1={X(0)} x2={X(l1)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.hb)} narrow="left" />
      <HDim x1={X(l1)} x2={X(l2)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wh)} (hoja)`} />
      <HDim x1={X(l2)} x2={X(r1)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.hc)} narrow="right" />
      <HDim x1={X(r1)} x2={X(r2)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wh)} (hoja)`} />
      <HDim x1={X(r2)} x2={X(v.W)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.hb)} narrow="right" />
      <HDim x1={X(0)} x2={X(v.W)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.W)} (hueco)`} />
      <DoorHeights sc={sc} v={v} o={o} fx={X(v.W)} />
    </Svg>
  );
}

export const giratoria2: Product = {
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
  outputs: [{ key: "wh", label: "Ancho de cada hoja", unit: "mm", main: true }, ...doorHeightsOutputs],
  checks: ["wh", "ah"],
  Drawing: Swing2Drawing,
  strips: (v, o) => [
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
    heightsStrip(v, o),
  ],
};