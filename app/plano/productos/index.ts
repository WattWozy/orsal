import type { Product } from "../lib/types";
import { rigidaEnmarcada, rigidaSinMarco } from "./vallas-rigidas";
import { vallasFlexibles } from "./vallas-flexibles";
import { giratoria1 } from "./puerta-giratoria-1";
import { giratoria2 } from "./puerta-giratoria-2";
import { corredera1 } from "./puerta-corredera-1";
import { corredera2 } from "./puerta-corredera-2";

/** Catálogo de productos en el orden en que aparecen en el selector. */
export const PRODUCTS: Product[] = [
  rigidaEnmarcada,
  rigidaSinMarco,
  ...vallasFlexibles,
  giratoria1,
  giratoria2,
  corredera1,
  corredera2,
];