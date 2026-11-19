import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { fmt, makeScene, Svg, HDim, VDim, Ground } from "@/lib/scene";

interface FlexibleDrawingProps {
  v: Values;
  o: Values;
  summarized?: boolean;
}

export function FlexibleDrawing({
  v,
  o,
  summarized = false,
}: FlexibleDrawingProps): ReactElement {
  const pw = 60; // ancho visual del poste

  const rawBays = Number.isFinite(o.v)
    ? o.v
    : Number.isFinite(o.n)
    ? Math.max(1, o.n - 1)
    : 1;
  const totalBays = Math.max(1, Math.round(rawBays));
  const sep = Number.isFinite(o.sep) && o.sep > 0 ? o.sep : v.L / totalBays;

  const canSummarize =
    summarized && totalBays > 2 && Number.isFinite(sep) && sep > 0 && v.L > sep;

  const cutStart = canSummarize ? Math.min(v.L, sep) : 0;
  const cutEnd = canSummarize ? Math.max(cutStart, v.L - sep) : 0;
  const compressedSpan = cutEnd - cutStart;
  const gapMm =
    canSummarize && compressedSpan > 0 ? Math.max(sep * 1.15, 350) : 0;

  const wx = (xWorld: number): number => {
    if (!canSummarize || compressedSpan <= 0 || xWorld <= cutStart) return xWorld;
    if (xWorld < cutEnd) {
      return cutStart + ((xWorld - cutStart) / compressedSpan) * gapMm;
    }
    return cutStart + gapMm + (xWorld - cutEnd);
  };

  const effL = canSummarize ? wx(v.L) : v.L;
  const sc = makeScene(-pw / 2, effL + pw / 2, v.H, v.e, 2, 2, 3);
  const { X, Y, s } = sc;

  const postIndices = new Set<number>();
  if (!canSummarize) {
    for (let i = 0; i <= totalBays; i++) postIndices.add(i);
  } else {
    postIndices.add(0);
    postIndices.add(1);
    postIndices.add(Math.max(0, totalBays - 1));
    postIndices.add(totalBays);
  }

  const posts: ReactElement[] = [];
  for (const i of Array.from(postIndices).sort((a, b) => a - b)) {
    const rawCenter = Math.min(i * sep, v.L);
    const px = X(wx(rawCenter) - pw / 2);
    posts.push(
      <g key={i}>
        <rect className="out" x={px} y={Y(v.H)} width={pw * s} height={v.H * s} />
        <rect className="bury" x={px} y={Y(0)} width={pw * s} height={v.e * s} />
      </g>
    );
  }

  const wires: ReactElement[] = [];
  const nh = Math.min(Math.max(0, Math.round(v.hil)), 12);
  for (let k = 0; k < nh; k++) {
    const frac = nh === 1 ? 0.5 : k / (nh - 1);
    const yy = v.s + 40 + (o.hm - 80) * frac;
    wires.push(
      <line
        key={k}
        className="wire"
        x1={X(wx(0))}
        x2={X(wx(v.L))}
        y1={Y(yy)}
        y2={Y(yy)}
      />
    );
  }

  const hiddenBays = Math.max(0, totalBays - 2);
  const hiddenPosts = Math.max(0, hiddenBays - 1);
  const gapLeft = X(wx(cutStart));
  const gapRight = X(wx(cutEnd));
  const gapMid = (gapLeft + gapRight) / 2;
  const topY = Y(v.H);
  const botMeshY = Y(v.s);
  const midMeshY = (topY + botMeshY) / 2;

  return (
    <Svg sc={sc}>
      <Ground x1={X(-pw / 2) - 14} x2={X(effL + pw / 2) + 14} y={Y(0)} />
      <rect
        className="mesh"
        x={X(wx(0))}
        y={Y(v.H)}
        width={Math.max(0, X(wx(v.L)) - X(wx(0)))}
        height={o.hm * s}
      />
      {wires}
      {posts}

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
            y1={midMeshY + 10}
            x2={gapLeft + 8}
            y2={midMeshY - 10}
          />
          <line
            x1={gapRight - 8}
            y1={midMeshY + 10}
            x2={gapRight + 8}
            y2={midMeshY - 10}
          />
          <text x={gapMid} y={midMeshY - 6} textAnchor="middle" fontSize="11">
            {hiddenBays} tramos ({hiddenPosts} postes)
          </text>
          <text x={gapMid} y={midMeshY + 10} textAnchor="middle" fontSize="10">
            intermedios omitidos
          </text>
        </g>
      )}

      <HDim
        x1={X(wx(0))}
        x2={X(wx(sep))}
        y={sc.top(0)}
        f1={Y(v.H)}
        f2={Y(v.H)}
        label={`${fmt(sep)} (eje–eje)`}
      />
      <HDim
        x1={X(wx(0))}
        x2={X(wx(v.L))}
        y={sc.top(1)}
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
        label={`${fmt(o.hm)} (malla)`}
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
        f={X(wx(v.L))}
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