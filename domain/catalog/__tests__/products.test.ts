import { describe, it, expect } from "vitest";
import { corredera1Definition } from "../puertas/corredera-1";
import { corredera2Definition } from "../puertas/corredera-2";
import { giratoria1Definition } from "../puertas/giratoria-1";
import { giratoria2Definition } from "../puertas/giratoria-2";
import { rigidaEnmarcadaDefinition } from "../vallas/rigidas";

describe("Product Catalog Domain Calculations", () => {
  describe("corredera-2 (2-leaf sliding gate)", () => {
    it("calculates leaf width and height correctly with defaults", () => {
      const result = corredera2Definition.compute(corredera2Definition.defaults);
      // wh = (W(6000) + 2*sp(150) + sc(50)) / 2 = 6350 / 2 = 3175
      expect(result.wh).toBe(3175);
      // ah = H(2000) - hi(50) - hs(30) = 1920
      expect(result.ah).toBe(1920);
    });
  });

  describe("giratoria-1 (1-leaf swing gate)", () => {
    it("calculates leaf width and height correctly with defaults", () => {
      const result = giratoria1Definition.compute(giratoria1Definition.defaults);
      // wh = W(1200) - hb(15) - hc(20) = 1165
      expect(result.wh).toBe(1165);
      // ah = H(2000) - hi(80) - hs(20) = 1900
      expect(result.ah).toBe(1900);
    });
  });

  describe("giratoria-2 (2-leaf swing gate)", () => {
    it("calculates half-leaf widths correctly with defaults", () => {
      const result = giratoria2Definition.compute(giratoria2Definition.defaults);
      // wh = (W(3000) - 2*hb(15) - hc(30)) / 2 = (3000 - 30 - 30) / 2 = 1470
      expect(result.wh).toBe(1470);
      expect(result.ah).toBe(1900);
    });
  });

  describe("rigida-enmarcada (framed rigid fence)", () => {
    it("calculates post pitch, panel width, and mesh interior dimensions correctly", () => {
      const result = rigidaEnmarcadaDefinition.compute(rigidaEnmarcadaDefinition.defaults);
      
      // Expected panel count and metrics based on L:12000, wmax:2500, p:60, h:10, m:40
      expect(result.n).toBe(5);
      expect(result.np).toBe(6);
      expect(result.wp).toBe(2308);
      expect(result.hp).toBe(1950);
      expect(result.wi).toBe(2228);
      expect(result.hi).toBe(1870);
    });
  });
});