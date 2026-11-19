import { describe, it, expect } from "vitest";
import { evaluateProduct, MAX_DRAW_POSTS } from "../evaluateProduct";
import type { ProductDefinition } from "@/domain/models/product";

const mockFenceProduct: ProductDefinition = {
  id: "test-valla",
  family: "Vallas",
  label: "Valla de Prueba",
  client: [{ key: "L", label: "Longitud" }],
  margins: [{ key: "holgura", label: "Holgura" }],
  defaults: { L: 5000, holgura: 20 },
  checks: ["anchoPanel", "n"],
  outputs: [{ key: "anchoPanel", label: "Ancho panel", unit: "mm", main: true }],
  compute: (v) => {
    const n = Math.ceil(v.L / 2500);
    const anchoPanel = (v.L - v.holgura * n) / n;
    return { n, anchoPanel };
  },
  strips: () => [],
};

describe("evaluateProduct", () => {
  it("marks valid inputs and positive outputs as drawable", () => {
    const result = evaluateProduct(mockFenceProduct, { L: 5000, holgura: 20 });

    expect(result.inputsOk).toBe(true);
    expect(result.outputs).toEqual({ n: 2, anchoPanel: 2480 });
    expect(result.checksOk).toBe(true);
    expect(result.tooMany).toBe(false);
    expect(result.canDraw).toBe(true);
  });

  it("fails inputsOk when a required field is NaN or missing", () => {
    const result = evaluateProduct(mockFenceProduct, { L: NaN, holgura: 20 });

    expect(result.inputsOk).toBe(false);
    expect(result.outputs).toEqual({});
    expect(result.checksOk).toBe(false);
    expect(result.canDraw).toBe(false);
  });

  it("fails checksOk when margins consume the entire opening (zero or negative output)", () => {
    const result = evaluateProduct(mockFenceProduct, { L: 100, holgura: 150 });

    expect(result.inputsOk).toBe(true);
    expect(result.outputs.anchoPanel).toBeLessThanOrEqual(0);
    expect(result.checksOk).toBe(false);
    expect(result.canDraw).toBe(false);
  });

it("flags tooMany while still allowing summarized drawing when a Vallas product exceeds MAX_DRAW_POSTS", () => {
    const hugeLength = (MAX_DRAW_POSTS + 1) * 2500;
    const result = evaluateProduct(mockFenceProduct, { L: hugeLength, holgura: 10 });

    expect(result.checksOk).toBe(true);
    expect(result.tooMany).toBe(true);
    expect(result.canDraw).toBe(true);
  });
});