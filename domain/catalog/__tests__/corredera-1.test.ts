import { describe, it, expect } from "vitest";
import { corredera1Definition } from "../puertas/corredera-1";

describe("corredera-1 domain calculations", () => {
  it("computes leaf length, leaf height, and side clearance correctly with default values", () => {
    const result = corredera1Definition.compute(corredera1Definition.defaults);

    // wh = W (4000) + sp (150) + cola (0) = 4150
    expect(result.wh).toBe(4150);
    // ah = H (2000) - hi (50) - hs (30) = 1920
    expect(result.ah).toBe(1920);
    // esp = wh (4150) + ml (100) = 4250
    expect(result.esp).toBe(4250);
  });

  it("handles cantilevered counterweights (cola) correctly", () => {
    const values = { ...corredera1Definition.defaults, cola: 500, W: 3000 };
    const result = corredera1Definition.compute(values);

    // wh = 3000 + 150 + 500 = 3650
    expect(result.wh).toBe(3650);
  });
});