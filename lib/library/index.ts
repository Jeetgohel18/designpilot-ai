import { readableOn, hexToHsl, hslToHex } from "../color";
import { darkTheme, semanticColors } from "../engine/palette";
import { uiStyleOf } from "../engine/uistyle";
import { gridGuidance, typeScale } from "../engine/starterkit";
import { fontFamilyCss } from "../fonts";
import type { Direction, Project } from "../types";
import { BLOCKS, TOKEN_DEFAULTS } from "./css";
import { FOUNDATIONS } from "./defs-foundations";
import { ACTIONS } from "./defs-actions";
import { CONTENT, NAVIGATION } from "./defs-nav-content";
import { FEEDBACK, PRODUCT } from "./defs-feedback-product";
import { attachBehaviors } from "./behavior";
import { esc } from "../vector/ir";
import { toTsx } from "./jsx";
import type { Category, Cfg, Component, Ctx } from "./types";

export const COMPONENTS: Component[] = [...FOUNDATIONS, ...ACTIONS, ...NAVIGATION, ...CONTENT, ...FEEDBACK, ...PRODUCT];
export const componentById = (id: string) => COMPONENTS.find((c) => c.id === id);
export const CATEGORIES: Category[] = ["foundations", "actions", "navigation", "content", "feedback", "product"];

export type ShadowLevel = "none" | "soft" | "medium" | "hard";
export interface Custom { radius: number; weight: number; accent: string | null; sp: number; bg: "direction" | "surface" | "white" | "dark" | "transparent"; border: number; shadow: ShadowLevel; width: "mobile" | "tablet" | "desktop"; dark: boolean }
export const SHADOWS: Record<ShadowLevel, string> = { none: "none", soft: "0 1px 2px rgba(0,0,0,.14), 0 4px 14px -6px rgba(0,0,0,.28)", medium: "0 8px 24px -8px rgba(0,0,0,.36)", hard: "4px 4px 0 rgba(0,0,0,.85)" };
export const WIDTHS = { mobile: 375, tablet: 768, desktop: 0 } as const;

const shadowLevel = (s: string): ShadowLevel => (s === "none" ? "none" : s.includes("0 0") && s.includes("0 0 0") ? "soft" : /\dpx \dpx 0/.test(s) ? "hard" : s.includes("24px") || s.includes("18px") ? "medium" : "soft");

/** Default customization = the selected direction's own tokens. */
export function defaultCustom(d: Direction): Custom {
  const ui = uiStyleOf(d);
  return { radius: ui.radius, weight: 600, accent: null, sp: ui.density === "airy" ? 1.15 : ui.density === "compact" ? 0.85 : 1, bg: "direction", border: parseInt(ui.border) || 1, shadow: shadowLevel(ui.shadow), width: "desktop", dark: false };
}

export function buildCtx(p: Pick<Project, "name">, d: Direction, custom: Custom): Ctx {
  const light = d.palette.colors;
  const base = custom.dark ? darkTheme(light) : { ...light };
  const colors = { ...base };
  if (custom.accent) colors.primary = custom.accent;
  const ui = uiStyleOf(d);
  const grid = gridGuidance(d);
  return { brand: p.name.split(/[·—-]/)[0].trim() || "Brand", heading: d.fonts.heading, body: d.fonts.body, colors, sem: semanticColors(colors.background), ui, scale: typeScale(d).steps, spacing: grid.spacing, dark: custom.dark, radius: custom.radius };
}

/** The CSS custom properties set on the preview stage. */
export function stageVars(ctx: Ctx, c: Custom): Record<string, string> {
  const k = ctx.colors, s = ctx.sem;
  return {
    "--color-primary": k.primary, "--color-secondary": k.secondary, "--color-accent": k.accent, "--color-background": k.background, "--color-surface": k.surface, "--color-text": k.text, "--color-border": k.border,
    "--color-success": s.success, "--color-warning": s.warning, "--color-danger": s.danger, "--color-info": s.info,
    "--color-on-primary": readableOn(k.primary), "--color-on-danger": readableOn(s.danger), "--color-on-success": readableOn(s.success),
    "--radius-base": `${c.radius}px`, "--border-w": `${c.border}px`, "--shadow": SHADOWS[c.shadow], "--weight-ui": String(c.weight), "--sp": String(c.sp),
    "--font-heading": fontFamilyCss(ctx.heading), "--font-body": fontFamilyCss(ctx.body),
  };
}

export function stageBackground(ctx: Ctx, bg: Custom["bg"]): string | null {
  switch (bg) { case "surface": return ctx.colors.surface; case "white": return "#ffffff"; case "dark": return "#0c0c10"; case "transparent": return null; default: return ctx.colors.background; }
}

/** Make ids unique when the same markup is shown several times (variant/state galleries). */
export function uniq(html: string, n: number): string {
  return html.replace(/\b(id|for|aria-describedby|aria-labelledby)="([^"]+)"/g, (_m, a: string, v: string) => `${a}="${v}-${n}"`);
}

export function blocksFor(c: Component): string[] { return ["base", ...new Set(c.css)]; }
/** Component CSS: only the blocks this component needs. */
export function componentCss(c: Component): string {
  return blocksFor(c).map((b) => BLOCKS[b]?.trim()).filter(Boolean).join("\n");
}
export const allCss = () => Object.values(BLOCKS).map((b) => b.trim()).join("\n");

export const defaultCfg = (c: Component): Cfg => ({ variant: c.controls.find((x) => x.key === "variant")?.default ?? "", size: c.controls.find((x) => x.key === "size")?.default ?? "md", iconPos: (c.controls.find((x) => x.key === "iconPos")?.default as Cfg["iconPos"]) ?? "none" });

/** Pretty-print HTML with simple indentation so exports are readable. */
export function prettyHtml(html: string): string {
  const tokens = html.replace(/>\s*</g, "><").split(/(?=<)|(?<=>)/).filter(Boolean);
  const inline = new Set(["span", "b", "i", "a", "small", "label", "button", "kbd", "code", "strong", "em", "mark", "time", "output", "option", "h1", "h2", "h3", "h4", "p", "li", "td", "th", "legend", "summary", "textarea", "text", "caption"]);
  const void_ = new Set(["input", "br", "hr", "img", "path", "circle", "rect", "line", "polyline", "polygon", "stop"]);
  let depth = 0, out = ""; let line = "";
  const flush = () => { if (line.trim()) out += "  ".repeat(Math.max(0, depth)) + line + "\n"; line = ""; };
  let openInline: string | null = null;
  for (const t of tokens) {
    if (t.startsWith("</")) { const n = t.slice(2).split(/[\s>]/)[0].toLowerCase(); if (openInline === n) { line += t; openInline = null; flush(); } else { flush(); depth--; line = t; flush(); } }
    else if (t.startsWith("<")) { const n = /^<([a-zA-Z0-9]+)/.exec(t)?.[1]?.toLowerCase() ?? ""; const selfClose = void_.has(n) || t.endsWith("/>"); if (openInline) { line += t; continue; } if (inline.has(n) && !selfClose) { flush(); openInline = n; line = t; } else if (selfClose) { flush(); line = t; flush(); } else { flush(); line = t; flush(); depth++; } }
    else line += t;
  }
  flush();
  return out.trim();
}

export function tokenRows(c: Component, vars: Record<string, string>): [string, string][] {
  return c.tokens.map((t) => [t, vars[t] ?? (t === "--font-heading" || t === "--font-body" ? vars[t] : "")] as [string, string]).filter(([, v]) => v);
}

export function tokensCss(vars: Record<string, string>): string {
  return `:root {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;
}
export function tokensJson(vars: Record<string, string>): string {
  const group = (prefix: string) => Object.fromEntries(Object.entries(vars).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), { $type: prefix === "--color-" ? "color" : prefix === "--font-" ? "fontFamily" : "dimension", $value: v }]));
  return JSON.stringify({ color: group("--color-"), font: group("--font-"), radius: { base: { $type: "dimension", $value: vars["--radius-base"] } }, border: { width: { $type: "dimension", $value: vars["--border-w"] } }, shadow: { base: { $value: vars["--shadow"] } }, typography: { weightUi: { $type: "fontWeight", $value: Number(vars["--weight-ui"]) } }, space: { density: { $value: Number(vars["--sp"]) } } }, null, 2);
}

/** Standalone HTML file: tokens + component CSS + markup (+ behavior script when interactive). Opens correctly with no other files. */
export function standaloneHtml(c: Component, cfg: Cfg, ctx: Ctx, custom: Custom, opts: { behavior?: boolean; fontLink?: string } = {}): string {
  const vars = stageVars(ctx, custom);
  const bg = stageBackground(ctx, custom.bg) ?? "transparent";
  const script = opts.behavior !== false && c.interactive ? `\n<script>\n(${attachBehaviors.toString()})(document.querySelector(".ds"));\n</script>` : "";
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${esc(c.name)} — ${esc(ctx.brand)}</title>\n${opts.fontLink ?? ""}\n<style>\n${tokensCss(vars)}\n${TOKEN_DEFAULTS ? "" : ""}body{margin:0;padding:24px;background:${bg};}\n${componentCss(c)}\n</style>\n</head>\n<body>\n<div class="ds">\n${prettyHtml(c.html(cfg, ctx))}\n</div>${script}\n</body>\n</html>\n`;
}

/** React/TSX example (static markup). */
export const componentTsx = (c: Component, cfg: Cfg, ctx: Ctx) => toTsx(c.id, c.name, c.html(cfg, ctx));
export const BEHAVIOR_SOURCE = () => `(${attachBehaviors.toString()})(document.querySelector(".ds"));`;
export { hexToHsl, hslToHex };
