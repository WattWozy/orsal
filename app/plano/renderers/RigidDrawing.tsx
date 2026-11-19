import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, VDim, Ground } from "@/lib/scene";

interface RigidDrawingProps {
  v: Values;
  o: Values;
  framed: boolean;
  summarized?: boolean;
}

export function RigidDrawing({
  v,
  o,
  framed,
  summarized = false,
}: RigidDrawingProps): ReactElement {
  const n = Math.max(1, Math.round(o.n ?? 1));
  const pitch = Number.isFinite(o.pitch) && o.pitch > 0 ? o.pitch : v.L / n;
  const canSummarize = summarized && n > 2 && pitch > 0 && v.L > pitch;

  // Mostramos el primer vano [0 .. pitch], un corte intermedio y el último vano [cutEnd .. v.L]
  const cutStart = canSummarize ? Math.min(v.L, pitch) : 0;
  const cutEnd = canSummarize ? Math.max(cutStart, v.L - pitch) : 0;
  const compressedSpan = cutEnd - cutStart;
  const gapMm =
    canSummarize && compressedSpan > 0 ? Math.max(pitch * 0.9, 350) : 0;

  const wx = (xWorld: number): number => {
    if (!canSummarize || compressedSpan <= 0 || xWorld <= cutStart) return xWorld;
    if (xWorld < cutEnd) {
      return cutStart + ((xWorld - cutStart) / compressedSpan) * gapMm;
    }
    return cutStart + gapMm + (xWorld - cutEnd);
  };

  const effL = canSummarize ? wx(v.L) : v.L;
  const sc = makeScene(0, effL, v.H, v.e, 3, 2, 3);
  const { X, Y, s } = sc;

  const postIndices = new Set<number>();
  const panelIndices = new Set<number>();

  if (!canSummarize) {
    for (let i = 0; i <= n; i++) postIndices.add(i);
    for (let i = 0; i < n; i++) panelIndices.add(i);
  } else {
    postIndices.add(0);
    postIndices.add(1);
    postIndices.add(Math.max(0, n - 1));
    postIndices.add(n);

    panelIndices.add(0);
    panelIndices.add(n - 1);
  }

  const posts: ReactElement[] = [];
  for (const i of Array.from(postIndices).sort((a, b) => a - b)) {
    const x = Math.min(i * pitch, v.L);
    posts.push(
      <g key={"p" + i}>
        <rect className="out" x={X(wx(x))} y={Y(v.H)} width={v.p * s} height={v.H * s} />
        <rect className="bury" x={X(wx(x))} y={Y(0)} width={v.p * s} height={v.e * s} />
      </g>
    );
  }

  const panels: ReactElement[] = [];
  for (const i of Array.from(panelIndices).sort((a, b) => a - b)) {
    const x = i * pitch + v.p + v.h;
    if (framed) {
      const iw = Math.max(0, o.wp - 2 * v.m);
      const ih = Math.max(0, o.hp - 2 * v.m);
      panels.push(
        <g key={"a" + i}>
          <rect className="frame" x={X(wx(x))} y={Y(v.H)} width={o.wp * s} height={o.hp * s} />
          <rect
            className="mesh"
            x={X(wx(x + v.m))}
            y={Y(v.H - v.m)}
            width={iw * s}
            height={ih * s}
          />
        </g>
      );
    } else {
      panels.push(
        <rect
          key={"a" + i}
          className="mesh"
          x={X(wx(x))}
          y={Y(v.H)}
          width={o.wp * s}
          height={o.hp * s}
        />
      );
    }
  }

  const lastPanelRight = v.L - v.p - v.h;
  const hiddenPanels = Math.max(0, n - 2);
  const hiddenPosts = Math.max(0, hiddenPanels - 1);
  const gapLeft = X(wx(cutStart));
  const gapRight = X(wx(cutEnd));
  const gapMid = (gapLeft + gapRight) / 2;
  const topY = Y(v.H);
  const botPanelY = Y(v.H - o.hp);
  const midPanelY = (topY + botPanelY) / 2;

  return (
    <Svg sc={sc}>
      <Ground x1={X(wx(0)) - 14} x2={X(wx(v.L)) + 14} y={Y(0)} />
      {posts}
      {panels}

      {canSummarize && compressedSpan > 0 && (
        <g className="cut-gap">
          <line
            x1={gapLeft}
            y1={topY - 8}
            x2={gapLeft}
            y2={Y(-v.e) + 8}
            strokeDasharray="5 4"
          />
          <line
            x1={gapRight}
            y1={topY - 8}
            x2={gapRight}
            y2={Y(-v.e) + 8}
            strokeDasharray="5 4"
          />
          <line
            x1={gapLeft - 8}
            y1={midPanelY + 10}
            x2={gapLeft + 8}
            y2={midPanelY - 10}
          />
          <line
            x1={gapRight - 8}
            y1={midPanelY + 10}
            x2={gapRight + 8}
            y2={midPanelY - 10}
          />
          <text x={gapMid} y={midPanelY - 6} textAnchor="middle" fontSize="11">
            {hiddenPanels} paneles ({hiddenPosts} postes)
          </text>
          <text x={gapMid} y={midPanelY + 10} textAnchor="middle" fontSize="10">
            intermedios omitidos
          </text>
        </g>
      )}

      <HDim
        x1={X(wx(v.p + v.h))}
        x2={X(wx(v.p + v.h + o.wp))}
        y={sc.top(0)}
        f1={Y(v.H)}
        f2={Y(v.H)}
        label={`${fmt(o.wp)} (panel)`}
      />
      <HDim
        x1={X(wx(v.p / 2))}
        x2={X(wx(v.p / 2 + pitch))}
        y={sc.top(1)}
        f1={Y(v.H)}
        f2={Y(v.H)}
        label={`${fmt(pitch)} (eje–eje)`}
      />
      <HDim
        x1={X(wx(0))}
        x2={X(wx(v.L))}
        y={sc.top(2)}
        f1={Y(v.H)}
        f2={Y(v.H)}
        label={`${fmt(v.L)} (tramo)`}
      />
      <VDim
        side="left"
        x={sc.left(0)}
        y1={Y(v.H)}
        y2={Y(v.s)}
        f={X(wx(0))}
        label={`${fmt(o.hp)} (panel)`}
      />
      <VDim
        side="left"
        x={sc.left(1)}
        y1={Y(v.H)}
        y2={Y(0)}
        f={X(wx(0))}
        label={fmt(v.H)}
      />
      <VDim
        side="right"
        x={sc.right(0)}
        y1={Y(v.s)}
        y2={Y(0)}
        f={X(wx(lastPanelRight))}
        label={fmt(v.s)}
        narrow="up"
      />
      <VDim
        side="right"
        x={sc.right(1)}
        y1={Y(0)}
        y2={Y(-v.e)}
        f={X(wx(v.L))}
        label={`${fmt(v.e)} (anclaje)`}
      />
      <VDim
        side="right"
        x={sc.right(2)}
        y1={Y(v.H)}
        y2={Y(-v.e)}
        f={X(wx(v.L))}
        label={`${fmt(o.hpo)} (poste)`}
      />
    </Svg>
  );
}