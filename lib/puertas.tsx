import type { Values, Field, OutRow, Strip } from "./types";
import { fmt, VDim } from "./scene";
import type { Scene } from "./scene";

/** Piezas comunes a todas las puertas. */

export const PW = 150; // ancho visual de pilar (mm), solo para el dibujo

/** Cadena de cotas verticales a la derecha: holgura sup · alto hoja · holgura inf, y altura libre. */
export function DoorHeights({ sc, v, o, fx }: { sc: Scene; v: Values; o: Values; fx: number }) {
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

export const heightsStrip = (v: Values, o: Values): Strip => ({
  title: "Alturas de arriba abajo (esquema, no a escala)",
  segs: [
    { label: "Holg. superior", mm: v.hs, kind: "holgura" },
    { label: "Alto de hoja", mm: o.ah, kind: "hoja" },
    { label: "Holg. inferior", mm: v.hi, kind: "holgura" },
  ],
});

export const doorHeightsOutputs: OutRow[] = [{ key: "ah", label: "Alto de hoja", unit: "mm", main: true }];

export const doorClient: Field[] = [
  { key: "W", label: "Hueco libre entre pilares" },
  { key: "H", label: "Altura libre disponible" },
];