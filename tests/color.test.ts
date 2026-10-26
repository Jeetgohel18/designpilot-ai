import { describe, it, expect } from "vitest";
import { contrast, hexToHsl, hslToHex, normalizeHex, rgbString, ensureContrast, wcagRating } from "../lib/color";

describe("color", () => {
  it("normalizes hex", () => { expect(normalizeHex("#abc")).toBe("#AABBCC"); expect(normalizeHex("zzz")).toBeNull(); });
  it("black/white contrast is 21", () => { expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 0); });
  it("known contrast: #777 on white ≈ 4.48", () => { expect(contrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 1); });
  it("hsl round-trips", () => { const { h, s, l } = hexToHsl("#3366CC"); expect(hslToHex(h, s, l)).toBe("#3366CC"); });
  it("rgb string", () => { expect(rgbString("#FF0000")).toBe("rgb(255, 0, 0)"); });
  it("ensureContrast reaches AA", () => { const c = ensureContrast("#999999", "#FFFFFF", 4.5); expect(contrast(c, "#FFFFFF")).toBeGreaterThanOrEqual(4.5); });
  it("rating", () => { expect(wcagRating(7.5).label).toBe("AAA"); expect(wcagRating(2).label).toBe("Fail"); });
});
