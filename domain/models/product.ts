export type ProductFamily = "Vallas" | "Puertas";

export type Values = Record<string, number>;

export type SegKind = "pilar" | "hoja" | "holgura" | "suelo";
export type Seg = { label: string; mm: number | null; kind: SegKind };
export type Strip = { title: string; segs: Seg[] };

export interface Field {
  key: string;
  label: string;
  hint?: string;
}

export interface OutputField {
  key: string;
  label: string;
  unit: string;
  main?: boolean;
}

export interface StripSegment {
  label: string;
  length: number;
  kind: "post" | "panel" | "gap";
}

export interface StripData {
  title: string;
  totalLength: number;
  segments: StripSegment[];
}

export interface ProductDefinition {
  id: string;
  family: ProductFamily;
  label: string;
  client: Field[];
  margins: Field[];
  defaults: Values;
  checks: string[];
  outputs: OutputField[];
  compute: (values: Values) => Values;
  strips: (values: Values, outputs: Values) => Strip[]; // Uses exact legacy Strip type
}