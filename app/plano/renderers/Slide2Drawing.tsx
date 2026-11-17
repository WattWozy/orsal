import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, Ground, Leaf } from "@/lib/scene";
import { PW, DoorHeights } from "@/lib/puertas";

interface Slide2DrawingProps {
  v: Values;
  o: Values;
}

export function Slide2Drawing({ v, o }: Slide2DrawingProps): ReactElement {
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