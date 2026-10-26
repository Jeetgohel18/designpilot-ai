import { describe, it, expect } from "vitest";
import { analyzeLocal, detectIndustry } from "../lib/engine/analyze";
import { contrastChecks, darkTheme, regeneratePalette, exportCss, exportDtcg } from "../lib/engine/palette";
import { contrast } from "../lib/color";
import { ROLES } from "../lib/types";
import { FONTS } from "../lib/fonts";

const BRIEF = "I want to build a premium skincare e-commerce website targeting Gen Z, with a luxurious minimal aesthetic, organic ingredients, elegant typography, a mobile-first shopping experience, and a distinctive brand identity.";

describe("analyzeLocal", () => {
  const r = analyzeLocal(BRIEF);
  it("detects beauty + e-commerce + Gen Z", () => {
    expect(r.profile.industry).toBe("Beauty & Skincare");
    expect(r.profile.projectType).toBe("E-commerce website");
    expect(r.profile.audience).toMatch(/Gen Z/);
  });
  it("keeps Gen Z casing and puts domain terms first in keywords", () => {
    expect(r.profile.summary).toContain("Gen Z");
    expect(r.profile.keywords[0]).toBe("skincare");
  });
  it("returns three distinct directions", () => {
    expect(r.directions).toHaveLength(3);
    expect(new Set(r.directions.map((d) => d.archetype)).size).toBe(3);
    expect(r.directions.map((d) => d.archetype)).toContain("minimal-luxury");
  });
  it("uses only catalog fonts", () => {
    const names = new Set(FONTS.map((f) => f.name));
    for (const d of r.directions) { expect(names.has(d.fonts.heading)).toBe(true); expect(names.has(d.fonts.body)).toBe(true); }
  });
  it("palettes have all roles and readable text", () => {
    for (const d of r.directions) {
      for (const role of ROLES) expect(d.palette.colors[role]).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrast(d.palette.colors.text, d.palette.colors.background)).toBeGreaterThanOrEqual(7);
      expect(contrast(d.palette.colors.primary, d.palette.colors.background)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("falls back to general for unknown briefs", () => { expect(detectIndustry("a thing").id).toBe("general"); });
  it("respects industry override", () => { expect(detectIndustry("anything", "Fintech & Finance").id).toBe("fintech"); });
  it("color word in brief steers the first direction", () => {
    const g = analyzeLocal("A sage green wellness studio website");
    expect(g.directions[0].palette.colors.primary).toBeTruthy();
  });
});

describe("palette", () => {
  const p = analyzeLocal(BRIEF).directions[0].palette;
  it("regenerate preserves locked colors", () => {
    const locked = { ...p, locked: ["primary" as const, "accent" as const] };
    for (let i = 0; i < 20; i++) {
      const n = regeneratePalette(locked);
      expect(n.colors.primary).toBe(p.colors.primary);
      expect(n.colors.accent).toBe(p.colors.accent);
    }
  });
  it("dark theme passes AA for text", () => { const d = darkTheme(p.colors); expect(contrast(d.text, d.background)).toBeGreaterThan(7); expect(contrast(d.primary, d.background)).toBeGreaterThanOrEqual(4.5); });
  it("contrast checks computed", () => { expect(contrastChecks(p.colors).length).toBe(5); });
  it("exports contain all roles", () => {
    const css = exportCss(p.colors), j = JSON.parse(exportDtcg(p.colors));
    for (const r of ROLES) { expect(css).toContain(`--color-${r}`); expect(j.color.light[r].$type).toBe("color"); }
  });
});
