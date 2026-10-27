import { describe, it, expect } from "vitest";
import { makeProject } from "./fixtures";
import { EXPORTS, escapeHtml, moodboardHtml, printableSummaryHtml, slug } from "../lib/engine/exports";
import { uiStyleOf } from "../lib/engine/uistyle";
import { semanticColors } from "../lib/engine/palette";
import { contrast } from "../lib/color";
import { checklist, starterSet, typeScale, gridGuidance } from "../lib/engine/starterkit";
import { buildMoodItems } from "../components/workspace/MoodboardTab";

describe("exports contain real, valid project data", () => {
  const p = makeProject();
  for (const e of EXPORTS) {
    it(`${e.id}: non-empty, correct format, uses project data`, () => {
      const out = e.build(p);
      expect(out.length).toBeGreaterThan(80);
      if (e.mime === "application/json") expect(() => JSON.parse(out)).not.toThrow();
      if (e.mime === "text/html") { expect(out.startsWith("<!doctype html>")).toBe(true); expect(out).toContain("</html>"); }
      if (e.mime === "text/css") { expect(out).toContain("--color-primary"); expect(out).toContain("--font-heading"); }
      expect(out).not.toMatch(/undefined|\[object Object\]|NaN/);
    });
  }
  it("filenames are unique and meaningful", () => { const f = EXPORTS.map((e) => e.filename); expect(new Set(f).size).toBe(f.length); expect(slug("Skincare · E-commerce!")).toBe("skincare-e-commerce"); });
  it("analysis export includes the brief and all three directions", () => {
    const md = EXPORTS.find((e) => e.id === "analysis")!.build(p);
    expect(md).toContain(p.brief); for (const d of p.directions) expect(md).toContain(d.name);
  });
  it("consolidated tokens include colors, semantic, typography, space and radius", () => {
    const j = JSON.parse(EXPORTS.find((e) => e.id === "tokens")!.build(p));
    expect(j.color.light.primary.$value).toBe(p.directions[0].palette.colors.primary);
    expect(Object.keys(j.semantic.light)).toEqual(["success", "warning", "danger", "info"]);
    expect(j.typography.heading.family).toBe(p.directions[0].fonts.heading); expect(j.space).toBeTruthy(); expect(j.radius.base.$value).toMatch(/px$/);
  });
  it("research export lists only real bookmarks with URLs, plus search links", () => {
    const withBm = makeProject(undefined, { bookmarks: [{ id: "b", kind: "reference", title: "Saved one", url: "https://example.com/x", source: "example.com", at: 1 }] });
    const md = EXPORTS.find((e) => e.id === "research")!.build(withBm);
    expect(md).toContain("[Saved one](https://example.com/x)"); expect(md).toContain("dribbble.com/search");
    expect(EXPORTS.find((e) => e.id === "research")!.build(p)).toContain("Nothing bookmarked yet");
  });
  it("checklist export reflects progress, tasks and requirements", () => {
    const q = makeProject(undefined, { starter: { done: ["c1", "screen:home"], extraScreens: ["Gift cards"] }, brainstorm: { ideas: [], tasks: [{ id: "t", text: "Draft hero", done: true }], requirements: [{ id: "r", text: "Must work one-handed" }] } });
    const md = EXPORTS.find((e) => e.id === "checklist")!.build(q);
    expect(md).toContain("- [x] Confirm the chosen direction"); expect(md).toContain("- [x] Draft hero"); expect(md).toContain("- [x] Home / landing"); expect(md).toContain("- [ ] Gift cards (added by you)"); expect(md).toContain("Must work one-handed");
  });
});

describe("HTML exports are escaped", () => {
  it("project data cannot inject markup", () => {
    const evil = makeProject(undefined, { name: '<script>alert(1)</script>', brief: '"><img src=x onerror=alert(1)>' });
    const html = printableSummaryHtml(evil);
    expect(html).not.toContain("<script>alert(1)"); expect(html).not.toContain("<img src=x"); expect(html).toContain("&lt;script&gt;");
    const board = { id: "m", name: "<b>x</b>", directionId: "", updatedAt: 1, items: [{ id: "1", type: "link" as const, title: "t", url: "javascript:alert(1)", source: "s" }, { id: "2", type: "note" as const, text: "<i>n</i>" }] };
    const m = moodboardHtml(evil, board);
    expect(m).not.toContain('href="javascript:'); expect(m).not.toContain("<i>n</i>");
  });
  it("escapeHtml handles quotes", () => { expect(escapeHtml(`a"b'c<d>&`)).toBe("a&quot;b&#39;c&lt;d&gt;&amp;"); });
  it("moodboard export reflects the board's items", () => {
    const p = makeProject(); const items = buildMoodItems(p, p.directions[0]);
    const html = moodboardHtml(p, { id: "m", name: "My board", directionId: p.directions[0].id, updatedAt: 1, items });
    expect(html).toContain("My board"); expect(html).toContain(p.directions[0].palette.colors.primary);
  });
});

describe("design-direction UI style", () => {
  it("the three directions differ in layout, radius and traits, not just color", () => {
    const p = makeProject();
    const s = p.directions.map(uiStyleOf);
    expect(new Set(s.map((x) => x.layout)).size).toBe(3);
    expect(new Set(s.map((x) => x.radius)).size).toBeGreaterThanOrEqual(2);
    for (const x of s) expect(x.traits.length).toBeGreaterThanOrEqual(3);
  });
  it("AI-written directions (no archetype id) still get a style from their wording", () => {
    const d = { ...makeProject().directions[0], archetype: "ai", name: "Playful sticker pop", summary: "Fun, colorful and quirky" };
    expect(uiStyleOf(d).layout).toBe("blocks");
  });
});

describe("semantic colors & starter kit", () => {
  it("semantic colors pass 4.5:1 on light and dark backgrounds", () => {
    for (const bg of ["#FAF8F5", "#101014", "#FFFFFF"]) for (const c of Object.values(semanticColors(bg))) expect(contrast(c, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it("screen sets depend on project type", () => {
    expect(starterSet(makeProject()).key).toBe("ecommerce");
    expect(starterSet(makeProject("A fintech web dashboard for freelancers to track invoices and cash flow")).key).toBe("fintech");
    expect(starterSet(makeProject("A SaaS platform for teams to manage projects")).key).toBe("saas");
    expect(starterSet(makeProject("something vague")).key).toBe("generic");
  });
  it("type scale is monotonic and grid spacing derives from density", () => {
    const d = makeProject().directions[0]; const t = typeScale(d);
    const sizes = t.steps.map((s) => s.size); expect([...sizes].sort((a, b) => b - a)).toEqual(sizes); expect(gridGuidance(d).spacing.length).toBe(9);
  });
  it("checklist has stable unique ids", () => { const p = makeProject(); const c = checklist(p, p.directions[0]); expect(new Set(c.map((x) => x.id)).size).toBe(c.length); });
});
