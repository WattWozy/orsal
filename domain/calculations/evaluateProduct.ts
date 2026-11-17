import type { ProductDefinition, Values } from "@/domain/models/product";

export const MAX_DRAW_POSTS = 15;

export interface EvaluationResult {
  inputsOk: boolean;
  outputs: Values;
  checksOk: boolean;
  tooMany: boolean;
  canDraw: boolean;
}

export function evaluateProduct(
  product: ProductDefinition,
  values: Values
): EvaluationResult {
  const inputKeys = [...product.client, ...product.margins].map((f) => f.key);
  
  // 1. Ensure all inputs are finite numbers
  const inputsOk = inputKeys.every((k) => Number.isFinite(values[k]));

  // 2. Extra safety: Ensure core client dimensions (like W, L, H) are strictly positive (> 0)
  const clientValuesValid = product.client.every((c) => {
    const val = values[c.key];
    return Number.isFinite(val) && val > 0;
  });

  const outputs = inputsOk && clientValuesValid ? product.compute(values) : {};

  // 3. Check if all required check keys are finite and positive
  const checksOk =
    inputsOk &&
    clientValuesValid &&
    product.checks.every((k) => Number.isFinite(outputs[k]) && outputs[k] > 0);

  const tooMany =
    product.family === "Vallas" &&
    Number.isFinite(outputs.n) &&
    outputs.n > MAX_DRAW_POSTS;

  const canDraw = checksOk && !tooMany;

  return { inputsOk, outputs, checksOk, tooMany, canDraw };
}