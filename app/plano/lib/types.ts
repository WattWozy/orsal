import type { ReactElement } from "react";

/** Tipos compartidos del visualizador. Todas las medidas en milímetros. */

export type Values = Record<string, number>;
export type Field = { key: string; label: string; hint?: string };
export type OutRow = { key: string; label: string; unit: string; main?: boolean };
export type SegKind = "pilar" | "hoja" | "holgura" | "suelo";
export type Seg = { label: string; mm: number | null; kind: SegKind };
export type Strip = { title: string; segs: Seg[] };

export type Product = {
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