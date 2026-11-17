import { describe, it, expect } from "vitest";
import { PRODUCTS } from "../index";
import { evaluateProduct } from "../../calculations/evaluateProduct";


describe("Product Catalog Integration Tests", () => {
  it("contains all migrated products and evaluates their defaults successfully", () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);

    for (const product of PRODUCTS) {
      const result = evaluateProduct(product, product.defaults);

      // Verify that inputs are valid and outputs are successfully computed
      expect(result.inputsOk, `Product ${product.id} failed inputsOk`).toBe(true);
      expect(result.checksOk, `Product ${product.id} failed structural checksOk`).toBe(true);
      expect(result.canDraw, `Product ${product.id} cannot be drawn with defaults`).toBe(true);

      // Verify that all required output keys are present and finite numbers
      for (const outputField of product.outputs) {
        const val = result.outputs[outputField.key];
        expect(
          Number.isFinite(val),
          `Output key '${outputField.key}' for product '${product.id}' resulted in non-finite value: ${val}`
        ).toBe(true);
      }
    }
  });

  it("fails checksOk when client width or height is excessively small or negative", () => {
    for (const product of PRODUCTS) {
      // Create invalid values where primary dimensions are zero or negative
      const invalidValues = {
        ...product.defaults,
        [product.client[0].key]: -100, // Negative main dimension
      };

      const result = evaluateProduct(product, invalidValues);
      
      // Should either fail input validation or check constraints, preventing invalid renders
      expect(result.canDraw).toBe(false);
    }
  });
});