import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "@/lib/scene";
import { PW, DoorHeights } from "@/lib/puertas";

interface Swing2DrawingProps {
  v: Values;
  o: Values;
}

export function Swing2Drawing({ v, o }: Swing2DrawingProps): ReactElement {
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