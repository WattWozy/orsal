import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, VDim, Ground } from "@/lib/scene";

interface FlexibleDrawingProps {
  v: Values;
  o: Values;
}

export function FlexibleDrawing({ v, o }: FlexibleDrawingProps): ReactElement {
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