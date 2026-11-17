import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, VDim, Ground } from "@/lib/scene";

interface RigidDrawingProps {
  v: Values;
  o: Values;
  framed: boolean;
}

export function RigidDrawing({ v, o, framed }: RigidDrawingProps): ReactElement {
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
      <HDim x1={X(v.p + v.h)} x2={X(v.p + v.h + o.wp)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wp)} (panel)`} />
      <HDim x1={X(v.p / 2)} x2={X(v.p / 2 + o.pitch)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.pitch)} (eje–eje)`} />
      <HDim x1={X(0)} x2={X(v.L)} y={sc.top(2)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.L)} (tramo)`} />
      <VDim side="left" x={sc.left(0)} y1={Y(v.H)} y2={Y(v.s)} f={X(0)} label={`${fmt(o.hp)} (panel)`} />
      <VDim side="left" x={sc.left(1)} y1={Y(v.H)} y2={Y(0)} f={X(0)} label={fmt(v.H)} />
      <VDim side="right" x={sc.right(0)} y1={Y(v.s)} y2={Y(0)} f={X(lastPanelRight)} label={fmt(v.s)} narrow="up" />
      <VDim side="right" x={sc.right(1)} y1={Y(0)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(v.e)} (anclaje)`} />
      <VDim side="right" x={sc.right(2)} y1={Y(v.H)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(o.hpo)} (poste)`} />
    </Svg>
  );
}