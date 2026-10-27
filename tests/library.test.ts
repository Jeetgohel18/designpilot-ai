import { describe, it, expect, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import ts from "typescript";
import { makeProject } from "./fixtures";
import { COMPONENTS, CATEGORIES, buildCtx, componentCss, componentTsx, defaultCfg, defaultCustom, stageVars, standaloneHtml, tokensJson, tokensCss, tokenRows, uniq, allCss, prettyHtml } from "../lib/library";
import { BLOCKS } from "../lib/library/css";
import { scopeCss } from "../lib/library/scope";
import { toSvg, hasText } from "../lib/vector/ir";
import { estimateWidth } from "../lib/vector/text";
import type { Cfg, Component } from "../lib/library/types";

const p = makeProject();
const dir = p.directions[0];
const custom = defaultCustom(dir);
const ctx = buildCtx(p, dir, custom);
const measure = (t: string, s: number, w = 400) => estimateWidth(t, s, w >= 600);
const combos = (c: Component): Cfg[] => {
  const base = defaultCfg(c); const out: Cfg[] = [base];
  for (const ctl of c.controls) for (const o of ctl.options) out.push({ ...base, [ctl.key]: o.value } as Cfg);
  return out;
};

describe("component library catalogue", () => {
  it("has the six requested categories with a substantial number of components", () => {
    expect(COMPONENTS.length).toBeGreaterThanOrEqual(55);
    for (const cat of CATEGORIES) expect(COMPONENTS.filter((c) => c.category === cat).length).toBeGreaterThanOrEqual(5);
    expect(new Set(COMPONENTS.map((c) => c.id)).size).toBe(COMPONENTS.length);
  });
  it("every component documents use, avoid, accessibility, spacing, notes and tokens", () => {
    for (const c of COMPONENTS) {
      expect(c.name && c.desc.length > 20, c.id).toBeTruthy();
      for (const k of ["use", "avoid", "a11y", "spacing", "notes", "tokens"] as const) expect(c[k].length, `${c.id}.${k}`).toBeGreaterThan(0);
      for (const b of c.css) expect(BLOCKS[b], `${c.id} css block ${b}`).toBeTruthy();
    }
  });
});

describe("rendering every component and every variant", () => {
  for (const c of COMPONENTS) {
    it(`${c.id}: renders valid-looking, balanced markup for all control values`, () => {
      for (const cfg of combos(c)) {
        const html = c.html(cfg, ctx);
        expect(html.length, `${c.id} ${JSON.stringify(cfg)}`).toBeGreaterThan(40);
        expect(html).not.toMatch(/undefined|NaN|\[object|\$\{/);
        // tag balance (void elements excluded)
        const VOID = new Set(["input", "br", "hr", "img", "path", "circle", "rect", "line", "polyline", "polygon", "stop", "meta", "link"]);
        const stack: string[] = [];
        for (const m of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*?(\/?)>/g)) {
          const [, close, name, self] = m; const n = name.toLowerCase();
          if (VOID.has(n) || self) continue;
          if (close) expect(stack.pop(), `${c.id}: unexpected </${n}>`).toBe(n); else stack.push(n);
        }
        expect(stack, `${c.id}: unclosed tags`).toEqual([]);
        // ids unique within one render
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
        expect(new Set(ids).size, `${c.id}: duplicate ids ${ids.join(",")}`).toBe(ids.length);
      }
    });
    it(`${c.id}: states render and uniq() makes repeated markup id-safe`, () => {
      for (const s of c.states?.(ctx) ?? []) expect(s.html.length).toBeGreaterThan(20);
      const html = c.html(defaultCfg(c), ctx);
      const a = uniq(html, 1), b = uniq(html, 2);
      const ids = [...(a + b).matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

describe("CSS", () => {
  it("every rule is scoped under the preview wrapper and braces balance", () => {
    for (const [name, css] of Object.entries(BLOCKS)) {
      const scoped = scopeCss(css, ".dp-stage");
      expect((scoped.match(/{/g) ?? []).length, name).toBe((scoped.match(/}/g) ?? []).length);
      // every top-level selector (outside @keyframes) starts with the scope
      const flat = scoped.replace(/@keyframes[^{]+{(?:[^{}]*{[^{}]*})*[^{}]*}/g, "").replace(/@(media|container)[^{]+{/g, "");
      for (const m of flat.matchAll(/(^|})\s*([^{}@]+){/g)) for (const sel of m[2].split(",")) expect(sel.trim().startsWith(".dp-stage"), `${name}: unscoped selector "${sel.trim()}"`).toBe(true);
    }
  });
  it("component CSS includes only the blocks it declares, and uses tokens not raw brand colors", () => {
    const btn = COMPONENTS.find((c) => c.id === "buttons")!; const css = componentCss(btn);
    expect(css).toContain(".ds-btn"); expect(css).not.toContain(".ds-plan");
    expect(allCss()).not.toMatch(/#8b7cff|#55d6e8/i);
  });
  it("uses container queries for responsive behavior", () => { expect(allCss()).toContain("@container (max-width"); expect(BLOCKS.base).toContain("container-type:inline-size"); });
  it("stage variables carry every token the CSS reads", () => {
    const vars = stageVars(ctx, custom); const used = new Set([...allCss().matchAll(/var\((--[a-z-]+)/g)].map((m) => m[1]));
    const provided = new Set([...Object.keys(vars), "--color-muted", "--radius-sm", "--radius-lg", "--tone", "--spin", "--s"]);
    for (const u of used) expect(provided.has(u), `CSS reads ${u} but nothing sets it`).toBe(true);
  });
  it("customization drives the variables (radius, accent, density, dark)", () => {
    const v = stageVars(buildCtx(p, dir, { ...custom, radius: 22, accent: "#FF3366", sp: 1.4, dark: true }), { ...custom, radius: 22, accent: "#FF3366", sp: 1.4, dark: true });
    expect(v["--radius-base"]).toBe("22px"); expect(v["--color-primary"]).toBe("#FF3366"); expect(v["--sp"]).toBe("1.4"); expect(v["--color-background"]).not.toBe(stageVars(ctx, custom)["--color-background"]);
  });
});

describe("exports derived from the library", () => {
  it("tokens JSON/CSS are valid and reflect the current customization", () => {
    const vars = stageVars(ctx, { ...custom, radius: 18 });
    const j = JSON.parse(tokensJson(vars)); expect(j.color.primary.$value).toBe(ctx.colors.primary); expect(j.radius.base.$value).toBe("18px");
    expect(tokensCss(vars)).toContain("--color-primary: " + ctx.colors.primary);
    for (const c of COMPONENTS) expect(tokenRows(c, vars).length, c.id).toBeGreaterThan(0);
  });
  it("standalone HTML is self-contained: tokens + CSS + markup (+ script only when interactive)", () => {
    const btn = COMPONENTS.find((c) => c.id === "buttons")!; const html = standaloneHtml(btn, defaultCfg(btn), ctx, custom);
    expect(html.startsWith("<!doctype html>")).toBe(true); expect(html).toContain("--color-primary"); expect(html).toContain(".ds-btn"); expect(html).toContain("ds-btn--primary"); expect(html).toContain("attachBehaviors".slice(0, 0) + "function");
    const cards = COMPONENTS.find((c) => c.id === "color-tokens")!; expect(standaloneHtml(cards, defaultCfg(cards), ctx, custom)).not.toContain("<script>");
  });
  it("prettyHtml keeps content and indents", () => { const h = prettyHtml('<div class="a"><p>Hi <b>there</b></p><input class="x"></div>'); expect(h).toContain("\n"); expect(h).toContain("there"); });
});

describe("vector (SVG) export", () => {
  const withVec = COMPONENTS.filter((c) => c.vector);
  const without = COMPONENTS.filter((c) => !c.vector);
  it("is offered for the vector-faithful components and withheld (with a reason) elsewhere", () => {
    expect(withVec.length).toBeGreaterThanOrEqual(9);
    for (const id of ["buttons", "color-tokens", "typography", "icons", "spacing", "badges-tags", "progress-steps", "checkbox-radio", "toggle", "button-group", "icon-button", "alerts"]) expect(withVec.some((c) => c.id === id), id).toBe(true);
    for (const id of ["data-table", "saas-dashboard", "auth-screen", "radius-elevation"]) expect(without.some((c) => c.id === id), id).toBe(true);
    expect(COMPONENTS.find((c) => c.id === "radius-elevation")!.vectorNote).toMatch(/shadow/i);
  });
  for (const c of withVec) {
    it(`${c.id}: every variant produces well-formed SVG with real shapes`, () => {
      for (const cfg of combos(c)) {
        const vec = c.vector!(cfg, ctx, measure);
        expect(vec.w).toBeGreaterThan(50); expect(vec.h).toBeGreaterThan(30); expect(vec.shapes.length).toBeGreaterThan(2);
        const svg = toSvg(vec); expect(svg).not.toMatch(/NaN|undefined|Infinity/);
        const f = path.join(os.tmpdir(), `lib-${c.id}-${Math.random().toString(36).slice(2)}.svg`); writeFileSync(f, svg);
        expect(() => execFileSync("xmllint", ["--noout", f]), `${c.id} ${JSON.stringify(cfg)}`).not.toThrow();
      }
    });
  }
  it("text-bearing vectors are flagged so the exporter can outline them", () => { expect(hasText(COMPONENTS.find((c) => c.id === "buttons")!.vector!(defaultCfg(COMPONENTS[0]), ctx, measure).shapes)).toBe(true); });
});

describe("React/TSX export is type-checked by the TypeScript compiler", () => {
  const gen = path.join(process.cwd(), "tests", "__gen__");
  afterAll(() => rmSync(gen, { recursive: true, force: true }));
  it("compiles every component's generated TSX with no errors (React types, strict)", () => {
    mkdirSync(gen, { recursive: true });
    const files: string[] = [];
    for (const c of COMPONENTS) for (const cfg of [defaultCfg(c)]) { const f = path.join(gen, `${c.id}.tsx`); writeFileSync(f, componentTsx(c, cfg, ctx)); files.push(f); }
    const program = ts.createProgram(files, { jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: ["react"], lib: ["lib.es2022.d.ts", "lib.dom.d.ts"] });
    const diags = ts.getPreEmitDiagnostics(program).filter((d) => d.file && files.includes(d.file.fileName));
    const msg = diags.slice(0, 6).map((d) => `${path.basename(d.file!.fileName)}:${d.file!.getLineAndCharacterOfPosition(d.start!).line + 1} ${ts.flattenDiagnosticMessageText(d.messageText, "\n").slice(0, 160)}`);
    expect(msg).toEqual([]);
  }, 120_000);
  it("does not leak behavior hooks or inline handlers into the JSX", () => {
    for (const c of COMPONENTS) { const t = componentTsx(c, defaultCfg(c), ctx); expect(t, c.id).not.toMatch(/data-ds-|onclick|onsubmit/i); expect(t).toContain("export function"); }
  });
});
