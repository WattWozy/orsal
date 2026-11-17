import type { ProductDefinition, Field, OutputField, Strip, Values } from "@/domain/models/product";

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

const flexOutputs: OutputField[] = [
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

function flexProductDefinition(id: string, label: string): ProductDefinition {
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
    strips: flexStrips,
  };
}

export const vallasFlexiblesDefinitions: ProductDefinition[] = [
  flexProductDefinition("simple-torsion", "Simple torsión"),
  flexProductDefinition("triple-torsion", "Triple torsión"),
  flexProductDefinition("anudada", "Anudada"),
  flexProductDefinition("otro", "Otra no rígida"),
];