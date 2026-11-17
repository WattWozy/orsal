import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "@/lib/scene";
import { PW, DoorHeights } from "@/lib/puertas";

interface Swing1DrawingProps {
  v: Values;
  o: Values;
}

export function Swing1Drawing({ v, o }: Swing1DrawingProps): ReactElement {
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