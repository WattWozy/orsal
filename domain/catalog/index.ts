import { ProductDefinition } from "@/domain/models/product";
import { corredera1Definition } from "./puertas/corredera-1";
import { corredera2Definition } from "./puertas/corredera-2";
import { giratoria1Definition } from "./puertas/giratoria-1";
import { giratoria2Definition } from "./puertas/giratoria-2";
import { rigidaEnmarcadaDefinition, rigidaSinMarcoDefinition } from "./vallas/rigidas";
import { vallasFlexiblesDefinitions } from "./vallas/flexibles";

export const PRODUCTS: ProductDefinition[] = [
  corredera1Definition,
  corredera2Definition,
  giratoria1Definition,
  giratoria2Definition,
  rigidaEnmarcadaDefinition,
  rigidaSinMarcoDefinition,
  ...vallasFlexiblesDefinitions,
];