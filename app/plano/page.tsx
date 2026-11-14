"use client";

/**
 * Visualizador de producto con acotaciones y holguras (vallas y puertas).
 *
 * - Sin dependencias externas: solo React + SVG.
 * - Todo es en milímetros. Las fórmulas replican el Excel "Calculadora_margenes_vallas_puertas".
 * - Estructura pensada para conectarlo luego al JSON del ingestor:
 *     1) PRODUCTS[].defaults  -> vendrá del JSON (medidas y márgenes por defecto)
 *     2) PRODUCTS[].compute   -> motor de cálculo (puro, sin UI)
 *     3) PRODUCTS[].Drawing   -> dibujo SVG a partir de entradas + resultados
 *   Cuando tengas el JSON, basta con sustituir `defaults` y mover `compute` a un módulo aparte.
 */

import { useMemo, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";

/* ======================================================================
   TIPOS
   ====================================================================== */

type Values = Record<string, number>;
type Field = { key: string; label: string; hint?: string };
type OutRow = { key: string; label: string; unit: string; main?: boolean };
type SegKind = "pilar" | "hoja" | "holgura" | "suelo";
type Seg = { label: string; mm: number | null; kind: SegKind };
type Strip = { title: string; segs: Seg[] };

type Product = {
  id: string;
  family: "Vallas" | "Puertas";
  label: string;
  client: Field[];
  margins: Field[];
  defaults: Values;
  compute: (v: Values) => Values;
  outputs: OutRow[];
  checks: string[];
  Drawing: (p: { v: Values; o: Values }) => ReactElement;
  strips: (v: Values, o: Values) => Strip[];
};

/* ======================================================================
   UTILIDADES
   ====================================================================== */

const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const fmt = (n: number) => (Number.isFinite(n) ? nf.format(n) : "—");

/* ======================================================================
   MOTOR GRÁFICO: escena, cotas, suelo
   ====================================================================== */

type Scene = {
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

function makeScene(
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

function Svg({ sc, children }: { sc: Scene; children: ReactNode }) {
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
function HDim(p: {
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
function VDim(p: {
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

function Ground({ x1, x2, y }: { x1: number; x2: number; y: number }) {
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
function Leaf(p: {
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

/* ======================================================================
   FRANJAS ESQUEMÁTICAS (no a escala) para ver las holguras pequeñas
   ====================================================================== */

const STRIP_FILL: Record<SegKind, string> = {
  pilar: "#cfd6de",
  hoja: "#dbe7f5",
  holgura: "#ffe3a3",
  suelo: "#e3e7eb",
};

function StripSvg({ strip }: { strip: Strip }) {
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

/* ======================================================================
   PRODUCTOS: VALLAS RÍGIDAS
   ====================================================================== */

const rigidCompute =
  (framed: boolean) =>
  (v: Values): Values => {
    const den = v.wmax + 2 * v.h + v.p;
    const nRaw = Math.ceil((v.L - v.p) / den);
    const n = Number.isFinite(nRaw) ? Math.max(1, nRaw) : NaN;
    const pitch = (v.L - v.p) / n;
    const vano = pitch - v.p;
    const wp = vano - 2 * v.h;
    const hp = v.H - v.s;
    const o: Values = { n, np: n + 1, pitch, vano, wp, hp, hpo: v.H + v.e };
    if (framed) {
      o.wi = wp - 2 * v.m;
      o.hi = hp - 2 * v.m;
    }
    return o;
  };

function RigidDrawing({ v, o, framed }: { v: Values; o: Values; framed: boolean }) {
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
      {/* cotas superiores: de menor a mayor */}
      <HDim x1={X(v.p + v.h)} x2={X(v.p + v.h + o.wp)} y={sc.top(0)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.wp)} (panel)`} />
      <HDim x1={X(v.p / 2)} x2={X(v.p / 2 + o.pitch)} y={sc.top(1)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(o.pitch)} (eje–eje)`} />
      <HDim x1={X(0)} x2={X(v.L)} y={sc.top(2)} f1={Y(v.H)} f2={Y(v.H)} label={`${fmt(v.L)} (tramo)`} />
      {/* cotas izquierdas */}
      <VDim side="left" x={sc.left(0)} y1={Y(v.H)} y2={Y(v.s)} f={X(0)} label={`${fmt(o.hp)} (panel)`} />
      <VDim side="left" x={sc.left(1)} y1={Y(v.H)} y2={Y(0)} f={X(0)} label={fmt(v.H)} />
      {/* cotas derechas */}
      <VDim side="right" x={sc.right(0)} y1={Y(v.s)} y2={Y(0)} f={X(lastPanelRight)} label={fmt(v.s)} narrow="up" />
      <VDim side="right" x={sc.right(1)} y1={Y(0)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(v.e)} (anclaje)`} />
      <VDim side="right" x={sc.right(2)} y1={Y(v.H)} y2={Y(-v.e)} f={X(v.L)} label={`${fmt(o.hpo)} (poste)`} />
    </Svg>
  );
}

const rigidStrips =
  (framed: boolean) =>
  (v: Values, o: Values): Strip[] => [
    {
      title: "Holguras en horizontal (esquema, no a escala)",
      segs: [
        { label: "Poste", mm: v.p, kind: "pilar" },
        { label: "Holgura", mm: v.h, kind: "holgura" },
        { label: framed ? "Panel enmarcado" : "Panel", mm: o.wp, kind: "hoja" },
        { label: "Holgura", mm: v.h, kind: "holgura" },
        { label: "Poste", mm: v.p, kind: "pilar" },
      ],
    },
    {
      title: "Alturas de arriba abajo (esquema, no a escala)",
      segs: [
        { label: "Panel", mm: o.hp, kind: "hoja" },
        { label: "Sep. suelo", mm: v.s, kind: "holgura" },
        { label: "Anclaje poste", mm: v.e, kind: "suelo" },
      ],
    },
  ];

const rigidOutputs = (framed: boolean): OutRow[] => [
  { key: "n", label: "Nº de paneles", unit: "ud" },
  { key: "np", label: "Nº de postes", unit: "ud" },
  { key: "pitch", label: "Distancia entre ejes de postes", unit: "mm" },
  { key: "vano", label: "Vano libre entre postes", unit: "mm" },
  { key: "wp", label: "Ancho de panel", unit: "mm", main: true },
  { key: "hp", label: "Alto de panel", unit: "mm", main: true },
  { key: "hpo", label: "Largo total del poste", unit: "mm" },
  ...(framed
    ? ([
        { key: "wi", label: "Ancho interior de malla", unit: "mm" },
        { key: "hi", label: "Alto interior de malla", unit: "mm" },
      ] as OutRow[])
    : []),
];

const rigidClient: Field[] = [
  { key: "L", label: "Longitud total del tramo", hint: "exterior a exterior de postes" },
  { key: "H", label: "Altura total visible" },
  { key: "wmax", label: "Ancho máximo de panel" },
];

const rigidMargins = (framed: boolean): Field[] => [
  { key: "p", label: "Ancho del poste" },
  { key: "h", label: "Holgura panel–poste (por lado)" },
  { key: "s", label: "Separación al suelo" },
  { key: "e", label: "Anclaje del poste" },
  ...(framed ? [{ key: "m", label: "Perfil del marco (por lado)" }] : []),
];

/* ======================================================================
   PRODUCTOS: VALLAS NO RÍGIDAS
   ====================================================================== */

const flexCompute = (v: Values): Values => {
  const vanos = Math.max(1, Math.ceil(v.L / v.dmax));
  const lm = v.L + 2 * v.rem;
  const nr = Math.ceil(lm / v.roll);
  return {
    hm: v.H - v.s,
    lm,
    nr,
    sob: nr * v.roll - lm,
    v: vanos,
    pi: vanos - 1,
    pt: vanos + 1,
    sep: v.L / vanos,
    hpo: v.H + v.e,
    al: v.hil * v.L,
  };
};

function FlexDrawing({ v, o }: { v: Values; o: Values }) {
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

const flexStrips = (v: Values, o: Values): Strip[] => [
  {
    title: "Malla en horizontal (esquema, no a escala)",
    segs: [
      { label: "Remate", mm: v.rem, kind: "holgura" },
      { label: "Tramo", mm: v.L, kind: "hoja" },
      { label: "Remate", mm: v.rem, kind: "holgura" },
    ],
  },
  {
    title: "Alturas de arriba abajo (esquema, no a escala)",
    segs: [
      { label: "Malla", mm: o.hm, kind: "hoja" },
      { label: "Sep. suelo", mm: v.s, kind: "holgura" },
      { label: "Anclaje poste", mm: v.e, kind: "suelo" },
    ],
  },
];

const flexClient: Field[] = [
  { key: "L", label: "Longitud total del tramo" },
  { key: "H", label: "Altura total visible" },
];
const flexMargins: Field[] = [
  { key: "s", label: "Separación al suelo" },
  { key: "rem", label: "Sobrante de malla por extremo" },
  { key: "dmax", label: "Separación máxima entre postes" },
  { key: "roll", label: "Longitud del rollo" },
  { key: "hil", label: "Nº de hilos tensores", hint: "ud" },
  { key: "e", label: "Anclaje del poste" },
];
const flexOutputs: OutRow[] = [
  { key: "hm", label: "Altura de malla", unit: "mm", main: true },
  { key: "lm", label: "Longitud de malla necesaria", unit: "mm", main: true },
  { key: "nr", label: "Nº de rollos", unit: "ud" },
  { key: "sob", label: "Sobrante de malla", unit: "mm" },
  { key: "v", label: "Nº de vanos", unit: "ud" },
  { key: "pi", label: "Postes intermedios", unit: "ud" },
  { key: "pt", label: "Postes totales (con extremos)", unit: "ud" },
  { key: "sep", label: "Separación real entre ejes", unit: "mm" },
  { key: "hpo", label: "Largo total del poste", unit: "mm" },
  { key: "al", label: "Alambre tensor total", unit: "mm" },
];
const flexDefaults: Values = { L: 25000, H: 1500, s: 50, rem: 300, dmax: 3000, roll: 25000, hil: 3, e: 600 };

/* ======================================================================
   PRODUCTOS: PUERTAS
   ====================================================================== */

const PW = 150; // ancho visual de pilar (mm), solo para el dibujo

/** Cadena de cotas verticales a la derecha: holgura sup · alto hoja · holgura inf, y altura libre. */
function DoorHeights({ sc, v, o, fx }: { sc: Scene; v: Values; o: Values; fx: number }) {
  const { Y } = sc;
  return (
    <>
      <VDim side="right" x={sc.right(0)} y1={Y(v.H)} y2={Y(v.H - v.hs)} f={fx} label={fmt(v.hs)} narrow="up" />
      <VDim side="right" x={sc.right(0)} y1={Y(v.H - v.hs)} y2={Y(v.hi)} f={fx} label={`${fmt(o.ah)} (hoja)`} />
      <VDim side="right" x={sc.right(0)} y1={Y(v.hi)} y2={Y(0)} f={fx} label={fmt(v.hi)} narrow="down" />
      <VDim side="right" x={sc.right(1)} y1={Y(v.H)} y2={Y(0)} f={fx} label={fmt(v.H)} />
    </>
  );
}

const heightsStrip = (v: Values, o: Values): Strip => ({
  title: "Alturas de arriba abajo (esquema, no a escala)",
  segs: [
    { label: "Holg. superior", mm: v.hs, kind: "holgura" },
    { label: "Alto de hoja", mm: o.ah, kind: "hoja" },
    { label: "Holg. inferior", mm: v.hi, kind: "holgura" },
  ],
});

const doorHeightsOutputs: OutRow[] = [{ key: "ah", label: "Alto de hoja", unit: "mm", main: true }];

/* ---- Giratoria 1 hoja ---- */
function Swing1Drawing({ v, o }: { v: Values; o: Values }) {
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

/* ---- Giratoria 2 hojas ---- */
function Swing2Drawing({ v, o }: { v: Values; o: Values }) {
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

/* ---- Corredera 2 hojas ---- */
function Slide2Drawing({ v, o }: { v: Values; o: Values }) {
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

/* ======================================================================
   CATÁLOGO DE PRODUCTOS
   ====================================================================== */

const swingMargins1: Field[] = [
  { key: "hb", label: "Holgura lado bisagras" },
  { key: "hc", label: "Holgura lado cierre" },
  { key: "hi", label: "Holgura inferior (suelo)" },
  { key: "hs", label: "Holgura superior" },
];
const doorClient: Field[] = [
  { key: "W", label: "Hueco libre entre pilares" },
  { key: "H", label: "Altura libre disponible" },
];

function flexProduct(id: string, label: string): Product {
  return {
    id,
    family: "Vallas",
    label,
    client: flexClient,
    margins: flexMargins,
    defaults: flexDefaults,
    compute: flexCompute,
    outputs: flexOutputs,
    checks: ["hm", "lm", "v"],
    Drawing: FlexDrawing,
    strips: flexStrips,
  };
}

const PRODUCTS: Product[] = [
  {
    id: "rigida-enmarcada",
    family: "Vallas",
    label: "Rígida enmarcada",
    client: rigidClient,
    margins: rigidMargins(true),
    defaults: { L: 12000, H: 2000, wmax: 2500, p: 60, h: 10, s: 50, e: 600, m: 40 },
    compute: rigidCompute(true),
    outputs: rigidOutputs(true),
    checks: ["wp", "hp", "wi", "hi"],
    Drawing: ({ v, o }) => <RigidDrawing v={v} o={o} framed />,
    strips: rigidStrips(true),
  },
  {
    id: "rigida-sin-marco",
    family: "Vallas",
    label: "Rígida no enmarcada",
    client: rigidClient,
    margins: rigidMargins(false),
    defaults: { L: 12000, H: 2000, wmax: 2500, p: 60, h: 20, s: 50, e: 600 },
    compute: rigidCompute(false),
    outputs: rigidOutputs(false),
    checks: ["wp", "hp"],
    Drawing: ({ v, o }) => <RigidDrawing v={v} o={o} framed={false} />,
    strips: rigidStrips(false),
  },
  flexProduct("simple-torsion", "Simple torsión"),
  flexProduct("triple-torsion", "Triple torsión"),
  flexProduct("anudada", "Anudada"),
  flexProduct("otro", "Otra no rígida"),
  {
    id: "giratoria-1",
    family: "Puertas",
    label: "Giratoria 1 hoja",
    client: doorClient,
    margins: swingMargins1,
    defaults: { W: 1200, H: 2000, hb: 15, hc: 20, hi: 80, hs: 20 },
    compute: (v) => ({ wh: v.W - v.hb - v.hc, ah: v.H - v.hi - v.hs }),
    outputs: [{ key: "wh", label: "Ancho de hoja", unit: "mm", main: true }, ...doorHeightsOutputs],
    checks: ["wh", "ah"],
    Drawing: Swing1Drawing,
    strips: (v, o) => [
      {
        title: "Holguras en horizontal (esquema, no a escala)",
        segs: [
          { label: "Pilar", mm: null, kind: "pilar" },
          { label: "Bisagras", mm: v.hb, kind: "holgura" },
          { label: "Hoja", mm: o.wh, kind: "hoja" },
          { label: "Cierre", mm: v.hc, kind: "holgura" },
          { label: "Pilar", mm: null, kind: "pilar" },
        ],
      },
      heightsStrip(v, o),
    ],
  },
  {
    id: "giratoria-2",
    family: "Puertas",
    label: "Giratoria 2 hojas",
    client: doorClient,
    margins: [
      { key: "hb", label: "Holgura lado bisagras (por lado)" },
      { key: "hc", label: "Holgura central entre hojas" },
      { key: "hi", label: "Holgura inferior (suelo)" },
      { key: "hs", label: "Holgura superior" },
    ],
    defaults: { W: 3000, H: 2000, hb: 15, hc: 30, hi: 80, hs: 20 },
    compute: (v) => ({ wh: (v.W - 2 * v.hb - v.hc) / 2, ah: v.H - v.hi - v.hs }),
    outputs: [{ key: "wh", label: "Ancho de cada hoja", unit: "mm", main: true }, ...doorHeightsOutputs],
    checks: ["wh", "ah"],
    Drawing: Swing2Drawing,
    strips: (v, o) => [
      {
        title: "Holguras en horizontal (esquema, no a escala)",
        segs: [
          { label: "Pilar", mm: null, kind: "pilar" },
          { label: "Bisagras", mm: v.hb, kind: "holgura" },
          { label: "Hoja", mm: o.wh, kind: "hoja" },
          { label: "Central", mm: v.hc, kind: "holgura" },
          { label: "Hoja", mm: o.wh, kind: "hoja" },
          { label: "Bisagras", mm: v.hb, kind: "holgura" },
          { label: "Pilar", mm: null, kind: "pilar" },
        ],
      },
      heightsStrip(v, o),
    ],
  },
  {
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
  },
  {
    id: "corredera-2",
    family: "Puertas",
    label: "Corredera 2 hojas",
    client: doorClient,
    margins: [
      { key: "sp", label: "Solape sobre cada pilar" },
      { key: "sc", label: "Solape central entre hojas", hint: "negativo = separación" },
      { key: "hi", label: "Holgura inferior (suelo)" },
      { key: "hs", label: "Holgura superior" },
      { key: "ml", label: "Margen lateral de apertura" },
    ],
    defaults: { W: 6000, H: 2000, sp: 150, sc: 50, hi: 50, hs: 30, ml: 100 },
    compute: (v) => {
      const wh = (v.W + 2 * v.sp + v.sc) / 2;
      return { wh, ah: v.H - v.hi - v.hs, esp: wh + v.ml };
    },
    outputs: [
      { key: "wh", label: "Largo de cada hoja", unit: "mm", main: true },
      ...doorHeightsOutputs,
      { key: "esp", label: "Espacio lateral necesario por lado", unit: "mm" },
    ],
    checks: ["wh", "ah"],
    Drawing: Slide2Drawing,
    strips: (v, o) => [
      {
        title: "Hueco y solapes (esquema, no a escala)",
        segs: [
          { label: "Solape pilar", mm: v.sp, kind: "holgura" },
          { label: "Medio hueco", mm: v.W / 2, kind: "hoja" },
          { label: "Solape central", mm: Math.abs(v.sc), kind: "holgura" },
          { label: "Medio hueco", mm: v.W / 2, kind: "hoja" },
          { label: "Solape pilar", mm: v.sp, kind: "holgura" },
        ],
      },
      heightsStrip(v, o),
    ],
  },
];

const MAX_DRAW_POSTS = 150;

/* ======================================================================
   PÁGINA
   ====================================================================== */

const CSS = `
.ov{max-width:1280px;margin:0 auto;padding:24px 20px 56px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.ov h1{font-size:22px;font-weight:650;margin:0 0 4px}
.ov .sub{opacity:.7;margin:0 0 20px;font-size:14px}
.ov-grid{display:grid;grid-template-columns:340px minmax(0,1fr);gap:28px;align-items:start}
@media (max-width:920px){.ov-grid{grid-template-columns:1fr}}
.ov-panel{display:flex;flex-direction:column;gap:18px}
.ov label.sel{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600}
.ov select,.ov input{font:inherit;color:inherit;background:transparent;border:1px solid rgba(128,128,128,.45);border-radius:6px;padding:7px 9px}
.ov select{font-size:15px;padding:9px}
.ov select:focus-visible,.ov input:focus-visible,.ov button:focus-visible{outline:2px solid #2f5597;outline-offset:1px}
.ov fieldset{border:1px solid rgba(128,128,128,.35);border-radius:8px;padding:12px 14px 14px;margin:0}
.ov legend{font-size:13px;font-weight:650;padding:0 6px}
.ov .row{display:grid;grid-template-columns:1fr 104px;gap:8px;align-items:center;margin-top:8px}
.ov .row span.l{font-size:13px;line-height:1.25}
.ov .row small{display:block;opacity:.6;font-size:11px}
.ov .row input{text-align:right;width:100%;box-sizing:border-box}
.ov .row input.client{background:rgba(255,235,0,.18)}
.ov .row input.bad{border-color:#b3261e}
.ov .sheet{border:1px solid rgba(128,128,128,.35);border-radius:8px;overflow:hidden;background:#fff}
.ov .sheetbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 10px}
.ov .sheetbar h2{font-size:16px;margin:0;font-weight:650}
.ov button{font:inherit;font-size:13px;color:inherit;background:transparent;border:1px solid rgba(128,128,128,.5);border-radius:6px;padding:7px 12px;cursor:pointer}
.ov button:hover{background:rgba(128,128,128,.12)}
.ov .strips{display:grid;gap:10px;margin-top:12px}
.ov .warn{border:1px solid #b3261e;border-radius:8px;padding:14px 16px;font-size:14px;color:#b3261e;background:rgba(179,38,30,.08)}
.ov .status{display:inline-block;font-size:12px;font-weight:650;padding:3px 9px;border-radius:99px}
.ov .status.ok{background:rgba(46,125,50,.16);color:#2e7d32}
.ov .status.bad{background:rgba(179,38,30,.14);color:#b3261e}
.ov table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
.ov td{padding:7px 4px;border-bottom:1px solid rgba(128,128,128,.25)}
.ov td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ov td.u{width:34px;opacity:.6;font-size:12px}
.ov tr.main td{font-weight:650}
.ov .legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;opacity:.75;margin-top:10px}
.ov .legend i{display:inline-block;width:12px;height:12px;border:1px solid #1d2733;vertical-align:-2px;margin-right:5px}
`;

function NumInput({
  value,
  onChange,
  client,
  bad,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  client?: boolean;
  bad?: boolean;
  id: string;
}) {
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      step="any"
      className={(client ? "client " : "") + (bad ? "bad" : "")}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
    />
  );
}

export default function ProductVisualizerPage() {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [all, setAll] = useState<Record<string, Values>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, { ...p.defaults }]))
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const v = all[product.id];
  const inputKeys = [...product.client, ...product.margins].map((f) => f.key);
  const inputsOk = inputKeys.every((k) => Number.isFinite(v[k]));

  const o = useMemo(() => (inputsOk ? product.compute(v) : {}), [product, v, inputsOk]);
  const checksOk = inputsOk && product.checks.every((k) => Number.isFinite(o[k]) && o[k] > 0);
  const tooMany = product.family === "Vallas" && Number.isFinite(o.n) && o.n > MAX_DRAW_POSTS;
  const canDraw = checksOk && !tooMany;

  const set = (k: string, n: number) =>
    setAll((prev) => ({ ...prev, [product.id]: { ...prev[product.id], [k]: n } }));

  const reset = () => setAll((prev) => ({ ...prev, [product.id]: { ...product.defaults } }));

  const downloadSvg = () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const vb = svg.viewBox.baseVal;
    clone.setAttribute("width", String(Math.round(vb.width)));
    clone.setAttribute("height", String(Math.round(vb.height)));
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const families: Array<"Vallas" | "Puertas"> = ["Vallas", "Puertas"];
  const Drawing = product.Drawing;

  const renderFields = (fields: Field[], client: boolean) =>
    fields.map((f) => (
      <div className="row" key={f.key}>
        <label htmlFor={`f-${f.key}`}>
          <span className="l">
            {f.label}
            {f.hint && <small>{f.hint}</small>}
          </span>
        </label>
        <NumInput
          id={`f-${f.key}`}
          value={v[f.key]}
          client={client}
          bad={!Number.isFinite(v[f.key])}
          onChange={(n) => set(f.key, n)}
        />
      </div>
    ));

  return (
    <main className="ov">
      <style>{CSS}</style>
      <h1>Visualizador de producto</h1>
      <p className="sub">Medidas en milímetros. Cambia las medidas del cliente o las holguras y el plano se actualiza.</p>

      <div className="ov-grid">
        <section className="ov-panel" aria-label="Datos del producto">
          <label className="sel">
            Producto
            <select value={productId} onChange={(e) => setProductId(e.target.value)}>
              {families.map((fam) => (
                <optgroup key={fam} label={fam}>
                  {PRODUCTS.filter((p) => p.family === fam).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>Medidas del cliente (mm)</legend>
            {renderFields(product.client, true)}
          </fieldset>

          <fieldset>
            <legend>Holguras y márgenes (mm)</legend>
            {renderFields(product.margins, false)}
          </fieldset>

          <div>
            <button type="button" onClick={reset}>
              Restablecer valores de ejemplo
            </button>
          </div>
        </section>

        <section aria-label="Plano y resultados">
          <div className="sheetbar">
            <h2>
              {product.family === "Vallas" ? "Valla" : "Puerta"} · {product.label}
            </h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className={"status " + (checksOk ? "ok" : "bad")}>{checksOk ? "OK" : "REVISAR"}</span>
              <button type="button" onClick={downloadSvg} disabled={!canDraw}>
                Descargar SVG
              </button>
            </div>
          </div>

          {!inputsOk && <div className="warn">Falta algún valor numérico. Rellena todos los campos para ver el plano.</div>}
          {inputsOk && !checksOk && (
            <div className="warn">
              Alguna medida resultante es cero o negativa: las holguras no caben en el hueco indicado. Revisa los valores.
            </div>
          )}
          {tooMany && (
            <div className="warn">
              Salen más de {MAX_DRAW_POSTS} paneles y el dibujo no sería legible. Aumenta el ancho máximo de panel o reduce la longitud.
            </div>
          )}

          {canDraw && (
            <>
              <div className="sheet" ref={wrapRef}>
                <Drawing v={v} o={o} />
              </div>
              <div className="legend" aria-hidden>
                <span>
                  <i style={{ background: "#cfd6de" }} />
                  Poste / pilar
                </span>
                <span>
                  <i style={{ background: "#dbe7f5" }} />
                  Panel / hoja / malla
                </span>
                <span>
                  <i style={{ background: "#ffe3a3" }} />
                  Holgura
                </span>
              </div>
              <div className="strips">
                {product.strips(v, o).map((st) => (
                  <div className="sheet" key={st.title}>
                    <StripSvg strip={st} />
                  </div>
                ))}
              </div>
            </>
          )}

          {inputsOk && (
            <table>
              <tbody>
                {product.outputs.map((r) => (
                  <tr key={r.key} className={r.main ? "main" : undefined}>
                    <td>{r.label}</td>
                    <td className="n">{fmt(o[r.key])}</td>
                    <td className="u">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
