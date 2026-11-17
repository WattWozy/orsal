import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "@/lib/scene";
import { PW, DoorHeights } from "@/lib/puertas"; // Keep existing presentation helpers

interface Slide1DrawingProps {
  v: Values;
  o: Values;
}

export function Slide1Drawing({ v, o }: Slide1DrawingProps): ReactElement {
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