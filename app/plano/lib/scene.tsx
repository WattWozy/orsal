import type { ReactElement, ReactNode } from "react";
import type { SegKind, Strip } from "./types";

/** Motor gráfico SVG: escena, cotas (HDim/VDim), suelo, hoja de puerta y franjas de holguras. */

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
export const fmt = (n: number) => (Number.isFinite(n) ? nf.format(n) : "—");

export type Scene = {
  vbW: number;
  vbH: number;
  s: number; // px por mm
  X: (mm: number) => number;
  Y: (mm: number) => number; // mm sobre el suelo (negativo = enterrado)
  top: (i: number) => number; // y de la fila i de cotas superiores
  left: (i: number) => number; // x de la columna i de cotas izquierdas
  right: (i: number) => number; // x de la columna i de cotas derechas
};

const ROW = 28;

export function makeScene(
  minX: number,
  maxX: number,
  hUp: number,
  hDown: number,
  topRows: number,
  leftRows: number,
  rightRows: number
): Scene {
  const VB = 1000;
  const padL = 24 + leftRows * ROW;
  const padR = 24 + rightRows * ROW;
  const padT = 24 + topRows * ROW;
  const padB = 34;
  const span = maxX - minX;
  const hTot = hUp + hDown;
  let s = (VB - padL - padR) / span;
  s = Math.min(s, 360 / hTot);
  const ox = padL + (VB - padL - padR - span * s) / 2;
  return {
    vbW: VB,
    vbH: padT + hTot * s + padB,
    s,
    X: (mm) => ox + (mm - minX) * s,
    Y: (mm) => padT + (hUp - mm) * s,
    top: (i) => padT - 18 - i * ROW,
    left: (i) => ox - 18 - i * ROW,
    right: (i) => ox + span * s + 18 + i * ROW,
  };
}

const SVG_CSS = `
.paper{fill:#fff}
.out{fill:#eef1f5;stroke:#1d2733;stroke-width:1.4}
.leaf{fill:#dbe7f5;stroke:#1d2733;stroke-width:1.6}
.frame{fill:#dbe7f5;stroke:#1d2733;stroke-width:1.8}
.mesh{fill:url(#mesh);stroke:#1d2733;stroke-width:1.2}
.bury{fill:none;stroke:#7a8794;stroke-width:1;stroke-dasharray:4 3}
.ghost{fill:none;stroke:#7a8794;stroke-width:1.3;stroke-dasharray:7 5}
.hw{fill:#1d2733}
.rail{stroke:#1d2733;stroke-width:.8;opacity:.55}
.wire{stroke:#1d2733;stroke-width:1.3}
.gline{stroke:#1d2733;stroke-width:1.6}
.gnd{stroke:#7a8794;stroke-width:1}
.dl{stroke:#b3261e;stroke-width:1}
.ext{stroke:#b3261e;stroke-width:.6;opacity:.75}
.arr{fill:#b3261e}
.dt{font:600 12px Arial,Helvetica,sans-serif;fill:#b3261e}
.cap{font:11px Arial,Helvetica,sans-serif;fill:#51606f}
.sv{font:600 12px Arial,Helvetica,sans-serif;fill:#1d2733}
.sl{font:11px Arial,Helvetica,sans-serif;fill:#51606f}
`;

export function Svg({ sc, children }: { sc: Scene; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${sc.vbW} ${sc.vbH}`}
      width="100%"
      role="img"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <style>{SVG_CSS}</style>
      <defs>
        <pattern id="mesh" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 0H8V8" fill="none" stroke="#5b6b7a" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect className="paper" width={sc.vbW} height={sc.vbH} />
      {children}
    </svg>
  );
}

/** Cota horizontal (px). Si es muy estrecha, flechas por fuera y texto al lado. */
export function HDim(p: {
  x1: number;
  x2: number;
  y: number;
  f1?: number;
  f2?: number;
  label: string;
  narrow?: "left" | "right";
}) {
  const a = Math.min(p.x1, p.x2);
  const b = Math.max(p.x1, p.x2);
  const inside = b - a >= 22;
  const side = p.narrow ?? "right";
  const { y } = p;
  return (
    <g>
      {p.f1 !== undefined && <line className="ext" x1={p.x1} x2={p.x1} y1={y - 3} y2={p.f1 - 2} />}
      {p.f2 !== undefined && <line className="ext" x1={p.x2} x2={p.x2} y1={y - 3} y2={p.f2 - 2} />}
      {inside ? (
        <>
          <line className="dl" x1={a} x2={b} y1={y} y2={y} />
          <polygon className="arr" points={`${a},${y} ${a + 7},${y - 2.5} ${a + 7},${y + 2.5}`} />
          <polygon className="arr" points={`${b},${y} ${b - 7},${y - 2.5} ${b - 7},${y + 2.5}`} />
          <text className="dt" x={(a + b) / 2} y={y - 5} textAnchor="middle">
            {p.label}
          </text>
        </>
      ) : (
        <>
          <line className="dl" x1={a - 12} x2={b + 12} y1={y} y2={y} />
          <polygon className="arr" points={`${a},${y} ${a - 7},${y - 2.5} ${a - 7},${y + 2.5}`} />
          <polygon className="arr" points={`${b},${y} ${b + 7},${y - 2.5} ${b + 7},${y + 2.5}`} />
          {side === "right" ? (
            <text className="dt" x={b + 14} y={y - 5} textAnchor="start">
              {p.label}
            </text>
          ) : (
            <text className="dt" x={a - 14} y={y - 5} textAnchor="end">
              {p.label}
            </text>
          )}
        </>
      )}
    </g>
  );
}

/** Cota vertical (px). `side` indica de qué lado del dibujo está. */
export function VDim(p: {
  x: number;
  y1: number;
  y2: number;
  f?: number;
  label: string;
  side: "left" | "right";
  narrow?: "up" | "down";
}) {
  const a = Math.min(p.y1, p.y2);
  const b = Math.max(p.y1, p.y2);
  const inside = b - a >= 22;
  const { x } = p;
  const dir = p.narrow ?? "up";
  const tx = p.side === "left" ? x - 5 : x + 14;
  const ext = (y: number) =>
    p.f === undefined ? null : p.side === "left" ? (
      <line className="ext" y1={y} y2={y} x1={x - 3} x2={p.f - 2} />
    ) : (
      <line className="ext" y1={y} y2={y} x1={x + 3} x2={p.f + 2} />
    );
  return (
    <g>
      {ext(a)}
      {ext(b)}
      {inside ? (
        <>
          <line className="dl" x1={x} x2={x} y1={a} y2={b} />
          <polygon className="arr" points={`${x},${a} ${x - 2.5},${a + 7} ${x + 2.5},${a + 7}`} />
          <polygon className="arr" points={`${x},${b} ${x - 2.5},${b - 7} ${x + 2.5},${b - 7}`} />
          <text className="dt" transform={`translate(${tx} ${(a + b) / 2}) rotate(-90)`} textAnchor="middle">
            {p.label}
          </text>
        </>
      ) : (
        <>
          <line className="dl" x1={x} x2={x} y1={a - 12} y2={b + 12} />
          <polygon className="arr" points={`${x},${a} ${x - 2.5},${a - 7} ${x + 2.5},${a - 7}`} />
          <polygon className="arr" points={`${x},${b} ${x - 2.5},${b + 7} ${x + 2.5},${b + 7}`} />
          {dir === "up" ? (
            <text className="dt" transform={`translate(${tx} ${a - 14}) rotate(-90)`} textAnchor="start">
              {p.label}
            </text>
          ) : (
            <text className="dt" transform={`translate(${tx} ${b + 14}) rotate(-90)`} textAnchor="end">
              {p.label}
            </text>
          )}
        </>
      )}
    </g>
  );
}

export function Ground({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const ticks: ReactElement[] = [];
  for (let x = x1 + 8; x < x2; x += 10) {
    ticks.push(<line key={x} className="gnd" x1={x} y1={y} x2={x - 6} y2={y + 6} />);
  }
  return (
    <g>
      <line className="gline" x1={x1} x2={x2} y1={y} y2={y} />
      {ticks}
    </g>
  );
}

/** Hoja de puerta (rectángulo + travesaños + bisagras/tirador opcionales). */
export function Leaf(p: {
  sc: Scene;
  x1: number; // mm
  x2: number; // mm
  y1: number; // mm (borde inferior)
  y2: number; // mm (borde superior)
  ghost?: boolean;
  hinge?: "left" | "right";
  handle?: "left" | "right";
}) {
  const { X, Y, s } = p.sc;
  const x = X(Math.min(p.x1, p.x2));
  const w = Math.abs(p.x2 - p.x1) * s;
  const yt = Y(p.y2);
  const h = (p.y2 - p.y1) * s;
  if (p.ghost) return <rect className="ghost" x={x} y={yt} width={w} height={h} />;
  const rails = [0.2, 0.4, 0.6, 0.8].map((f) => (
    <line key={f} className="rail" x1={x} x2={x + w} y1={yt + h * f} y2={yt + h * f} />
  ));
  const hx = p.hinge === "left" ? x - 3 : x + w - 3;
  return (
    <g>
      <rect className="leaf" x={x} y={yt} width={w} height={h} />
      {rails}
      {p.hinge && (
        <>
          <rect className="hw" x={hx} y={yt + h * 0.12} width={6} height={Math.max(8, 110 * s)} />
          <rect className="hw" x={hx} y={yt + h * 0.88 - Math.max(8, 110 * s)} width={6} height={Math.max(8, 110 * s)} />
        </>
      )}
      {p.handle && (
        <circle className="hw" cx={p.handle === "left" ? x + 12 : x + w - 12} cy={yt + h * 0.5} r={4} />
      )}
    </g>
  );
}

const STRIP_FILL: Record<SegKind, string> = {
  pilar: "#cfd6de",
  hoja: "#dbe7f5",
  holgura: "#ffe3a3",
  suelo: "#e3e7eb",
};

export function StripSvg({ strip }: { strip: Strip }) {
  const W = 1000;
  const x0 = 30;
  const avail = W - 2 * x0;
  const segs = strip.segs.filter((s) => s.mm === null || s.mm > 0);
  const GAP = 52;
  const FIXED = 80;
  const flexTotal = segs.reduce((t, s) => (s.kind !== "holgura" && s.mm !== null ? t + s.mm : t), 0);
  const fixedPx = segs.reduce((t, s) => (s.kind === "holgura" ? t + GAP : s.mm === null ? t + FIXED : t), 0);
  const free = Math.max(avail - fixedPx, 100);
  let raw = segs.map((s) =>
    s.kind === "holgura" ? GAP : s.mm === null ? FIXED : Math.max(70, (free * s.mm) / (flexTotal || 1))
  );
  const tot = raw.reduce((a, b) => a + b, 0);
  if (tot > avail) raw = raw.map((w) => (w * avail) / tot);
  let cx = x0;
  let gapIdx = 0;
  const barY = 34;
  const barH = 34;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} 120`}
      width="100%"
      role="img"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <style>{SVG_CSS}</style>
      <rect className="paper" width={W} height={120} />
      <text className="cap" x={x0} y={16}>
        {strip.title}
      </text>
      {segs.map((s, i) => {
        const w = raw[i];
        const x = cx;
        cx += w;
        const stagger = s.kind === "holgura" ? (gapIdx++ % 2) * 14 : 0;
        return (
          <g key={i}>
            <rect
              x={x}
              y={barY}
              width={w}
              height={barH}
              fill={STRIP_FILL[s.kind]}
              stroke="#1d2733"
              strokeWidth={1.2}
            />
            {s.mm !== null && (
              <text className="sv" x={x + w / 2} y={barY + barH / 2 + 4} textAnchor="middle">
                {fmt(s.mm)}
              </text>
            )}
            <text className="sl" x={x + w / 2} y={barY + barH + 18 + stagger} textAnchor="middle">
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}