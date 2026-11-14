import type { Product, Values } from "../lib/types";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "../lib/scene";
import { PW, DoorHeights, heightsStrip, doorHeightsOutputs, doorClient } from "../lib/puertas";

/** Puerta corredera de 1 hoja. */

/* ---- Corredera 1 hoja (cerrada; en discontinua, abierta) ---- */
function Slide1Drawing({ v, o }: { v: Values; o: Values }) {
  const minX = Math.min(-o.esp, -PW);
  const maxX = Math.max(v.W + PW, v.W + v.sp);
  const sc = makeScene(minX, maxX, v.H, 0, 3, 0, 2);
  const { X, Y, s } = sc;
  const x1 = -v.cola;
  const x2 = v.W + v.sp;
  return (
    <Svg sc={sc}>
      <Ground x1={X(minX) - 14} x2={X(maxX) + 14} y={Y(0)} />
      <rect className="out" x={X(-PW)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <rect className="out" x={X(v.W)} y={Y(v.H)} width={PW * s} height={v.H * s} />
      <Leaf sc={sc} x1={-o.wh} x2={0} y1={v.hi} y2={v.H - v.hs} ghost />
      <Leaf sc={sc} x1={x1} x2={x2} y1={v.hi} y2={v.H - v.hs} handle="right" />
      <text className="cap" x={X(-o.wh / 2)} y={Y(v.H / 2)} textAnchor="middle">
        posición abierta
      </text>
      {v.cola > 0 && (
        <HDim x1={X(x1)} x2={X(0)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.cola)} (cola)`} />
      )}
      <HDim x1={X(v.W)} x2={X(x2)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={fmt(v.sp)} narrow="right" />
      <HDim x1={X(0)} x2={X(v.W)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.W)} (hueco)`} />
      <HDim x1={X(x1)} x2={X(x2)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wh)} (hoja)`} />
      <HDim x1={X(-o.esp)} x2={X(0)} y={sc.top(2)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.esp)} (espacio lateral)`} />
      <DoorHeights sc={sc} v={v} o={o} fx={X(x2)} />
    </Svg>
  );
}

export const corredera1: Product = {
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
    { key: "esp", label: "Espacio lateral necesario para abrir", unit: "mm" },
  ],
  checks: ["wh", "ah"],
  Drawing: Slide1Drawing,
  strips: (v, o) => [
    {
      title: "Largo de hoja (esquema, no a escala)",
      segs: [
        { label: "Cola", mm: v.cola, kind: "holgura" },
        { label: "Hueco libre", mm: v.W, kind: "hoja" },
        { label: "Solape pilar", mm: v.sp, kind: "holgura" },
      ],
    },
    heightsStrip(v, o),
  ],
};