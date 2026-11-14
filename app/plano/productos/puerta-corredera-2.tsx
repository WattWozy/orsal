import type { Product, Values } from "../lib/types";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "../lib/scene";
import { PW, DoorHeights, heightsStrip, doorHeightsOutputs, doorClient } from "../lib/puertas";

/** Puerta corredera de 2 hojas. */

/* ---- Corredera 2 hojas ---- */
function Slide2Drawing({ v, o }: { v: Values; o: Values }) {
  const minX = Math.min(-o.esp, -PW);
  const maxX = Math.max(v.W + o.esp, v.W + PW);
  const sc = makeScene(minX, maxX, v.H, 0, 4, 0, 2);
  const { X, Y, s } = sc;
  const mid = v.W / 2;
  const aL = -v.sp;
  const bL = mid + v.sc / 2;
  const aR = mid - v.sc / 2;
  const bR = v.W + v.sp;
  return (
    <Svg sc={sc}>
      <Ground x1={X(minX) - 14} x2={X(maxX) + 14} y={Y(0)} />
      <rect className="out" x={X(-PW)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <rect className="out" x={X(v.W)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <Leaf sc={sc} x1={-o.wh} x2={0} y1={v.hi} y2={v.H - v.hs} ghost />
      <Leaf sc={sc} x1={v.W} x2={v.W + o.wh} y1={v.hi} y2={v.H - v.hs} ghost />
      <Leaf sc={sc} x1={aL} x2={bL} y1={v.hi} y2={v.H - v.hs} handle="right" />
      <Leaf sc={sc} x1={aR} x2={bR} y1={v.hi} y2={v.H - v.hs} handle="left" />
      <HDim x1={X(aL)} x2={X(0)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.sp)} narrow="left" />
      <HDim x1={X(mid - Math.abs(v.sc) / 2)} x2={X(mid + Math.abs(v.sc) / 2)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.sc)} narrow="right" />
      <HDim x1={X(v.W)} x2={X(bR)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.sp)} narrow="right" />
      <HDim x1={X(aL)} x2={X(bL)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wh)} (cada hoja)`} />
      <HDim x1={X(0)} x2={X(v.W)} y={sc.top(2)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.W)} (hueco)`} />
      <HDim x1={X(-o.esp)} x2={X(0)} y={sc.top(3)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.esp)} (espacio lateral)`} />
      <HDim x1={X(v.W)} x2={X(v.W + o.esp)} y={sc.top(3)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.esp)} (espacio lateral)`} />
      <DoorHeights sc={sc} v={v} o={o} fx={X(bR)} />
    </Svg>
  );
}

export const corredera2: Product = {
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
  Drawing: Slide2Drawing,
  strips: (v, o) => [
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
    heightsStrip(v, o),
  ],
};