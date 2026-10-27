import { hslToHex, hexToHsl, ensureContrast, readableOn, contrast } from "../color";
import type { Palette, PaletteColors, Role } from "../types";
import { ROLES } from "../types";

export type Scheme = "monochrome" | "analogous" | "complementary" | "split" | "triadic";
export interface PaletteSpec {
  name: string;
  hue: number;
  sat: number;
  scheme: Scheme;
  /** background temperature: cool tint, warm cream, or neutral */
  tone?: "cool" | "warm" | "neutral";
  depth?: "light" | "deep"; // deep = dark primary used on light UI
}

const wrap = (h: number) => ((h % 360) + 360) % 360;

const SCHEME_INFO: Record<Scheme, { label: string; why: string }> = {
  monochrome: { label: "Monochromatic", why: "One hue in several lightness steps gives a calm, cohesive, premium feel; the accent comes from a lightness jump rather than a new hue." },
  analogous: { label: "Analogous", why: "Neighbouring hues sit side by side on the wheel, so the palette feels harmonious and natural with gentle variation." },
  complementary: { label: "Complementary", why: "Opposite hues create maximum energy; the primary carries the brand and the opposite hue is reserved for the call-to-action accent." },
  split: { label: "Split-complementary", why: "A base hue plus the two hues beside its opposite: strong contrast with less tension than a pure complement." },
  triadic: { label: "Triadic", why: "Three evenly spaced hues give a lively, playful palette; neutrals and restraint keep it from feeling noisy." },
};

export function buildColors(spec: PaletteSpec): PaletteColors {
  const { hue, sat, scheme } = spec;
  const tone = spec.tone ?? "cool";
  const bgHue = tone === "warm" ? 40 : tone === "neutral" ? hue : hue;
  const bgSat = tone === "warm" ? 30 : tone === "neutral" ? 6 : 22;
  const background = hslToHex(bgHue, bgSat, 97);
  const surface = hslToHex(bgHue, Math.min(bgSat, 20), 100);
  const text = hslToHex(tone === "warm" ? 30 : hue, 22, 9);
  const border = hslToHex(bgHue, Math.min(bgSat, 18), 88);

  const deep = spec.depth === "deep";
  let primary = hslToHex(hue, sat, deep ? 26 : 42);
  let secondary: string, accent: string;
  switch (scheme) {
    case "monochrome":
      secondary = hslToHex(hue, Math.max(sat - 20, 10), 70);
      accent = hslToHex(hue, Math.min(sat + 10, 100), 58);
      break;
    case "analogous":
      secondary = hslToHex(wrap(hue + 28), Math.max(sat - 12, 15), 62);
      accent = hslToHex(wrap(hue - 32), Math.min(sat + 8, 100), 52);
      break;
    case "complementary":
      secondary = hslToHex(wrap(hue + 14), Math.max(sat - 25, 12), 78);
      accent = hslToHex(wrap(hue + 180), Math.min(sat + 5, 95), 50);
      break;
    case "split":
      secondary = hslToHex(wrap(hue + 150), Math.max(sat - 15, 20), 62);
      accent = hslToHex(wrap(hue + 210), Math.min(sat + 5, 95), 54);
      break;
    default:
      secondary = hslToHex(wrap(hue + 120), Math.max(sat - 10, 25), 60);
      accent = hslToHex(wrap(hue + 240), Math.min(sat + 5, 95), 56);
  }
  // Primary must carry white text or sit on the background with at least AA-large contrast.
  primary = ensureContrast(primary, background, 4.5);
  return { primary, secondary, accent, background, surface, text, border };
}

export function gradientsFor(c: PaletteColors): { name: string; css: string }[] {
  const p = hexToHsl(c.primary);
  return [
    { name: "Brand sweep", css: `linear-gradient(135deg, ${c.primary} 0%, ${c.accent} 100%)` },
    { name: "Soft wash", css: `linear-gradient(180deg, ${c.background} 0%, ${c.secondary}33 100%)` },
    { name: "Depth", css: `radial-gradient(120% 120% at 0% 0%, ${hslToHex(p.h, p.s, Math.max(p.l - 14, 8))} 0%, ${c.primary} 60%, ${c.secondary} 100%)` },
  ];
}

let counter = 0;
export const newId = (p = "id") => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function makePalette(spec: PaletteSpec, mood?: string): Palette {
  const colors = buildColors(spec);
  const info = SCHEME_INFO[spec.scheme];
  return {
    id: newId("pal"),
    name: spec.name,
    harmony: info.label,
    mood: mood ?? `${info.why} Primary is a ${spec.depth === "deep" ? "deep" : "mid-tone"} hue at ${spec.hue}°, adjusted to pass WCAG AA against the background.`,
    colors,
    locked: [],
    gradients: gradientsFor(colors),
  };
}

const SCHEMES: Scheme[] = ["monochrome", "analogous", "complementary", "split", "triadic"];

/** Regenerate a palette, preserving locked roles. Seeded variation around the existing primary hue. */
export function regeneratePalette(prev: Palette, rand: () => number = Math.random): Palette {
  const base = hexToHsl(prev.colors.primary);
  const scheme = SCHEMES[Math.floor(rand() * SCHEMES.length)];
  const hue = prev.locked.includes("primary") ? base.h : wrap(base.h + (rand() - 0.5) * 140);
  const sat = Math.round(Math.min(90, Math.max(25, base.s + (rand() - 0.5) * 30)));
  const fresh = buildColors({ name: prev.name, hue, sat, scheme, tone: rand() > 0.6 ? "warm" : "cool", depth: rand() > 0.7 ? "deep" : "light" });
  const colors = { ...fresh } as PaletteColors;
  for (const r of prev.locked) colors[r] = prev.colors[r];
  const info = SCHEME_INFO[scheme];
  return { ...prev, id: newId("pal"), harmony: info.label, mood: info.why + " (Regenerated — locked colors were preserved.)", colors, gradients: gradientsFor(colors) };
}

export function setColor(p: Palette, role: Role, hex: string): Palette {
  const colors = { ...p.colors, [role]: hex };
  return { ...p, colors, gradients: gradientsFor(colors), harmony: "Custom" , mood: p.mood };
}

/** Derive a dark-theme version of a light palette. */
export function darkTheme(c: PaletteColors): PaletteColors {
  const p = hexToHsl(c.primary);
  const bgHue = p.h;
  const background = hslToHex(bgHue, 18, 7);
  const surface = hslToHex(bgHue, 16, 11);
  const text = hslToHex(bgHue, 12, 94);
  const border = hslToHex(bgHue, 12, 20);
  const lift = (hex: string) => {
    const h = hexToHsl(hex);
    return ensureContrast(hslToHex(h.h, h.s, Math.max(h.l, 58)), background, 4.5);
  };
  return { primary: lift(c.primary), secondary: lift(c.secondary), accent: lift(c.accent), background, surface, text, border };
}

export interface ContrastCheck { label: string; fg: Role; bg: Role; ratio: number }
export function contrastChecks(c: PaletteColors): ContrastCheck[] {
  const pairs: [string, Role, Role][] = [
    ["Text on background", "text", "background"],
    ["Text on surface", "text", "surface"],
    ["Primary on background", "primary", "background"],
    ["Accent on background", "accent", "background"],
  ];
  const out: ContrastCheck[] = pairs.map(([label, fg, bg]) => ({ label, fg, bg, ratio: contrast(c[fg], c[bg]) }));
  out.push({ label: "Button label on primary", fg: "background", bg: "primary", ratio: contrast(readableOn(c.primary), c.primary) });
  return out;
}

export function exportCss(c: PaletteColors, name = "brand"): string {
  const d = darkTheme(c);
  const block = (x: PaletteColors) => ROLES.map((r) => `  --color-${r}: ${x[r]};`).join("\n");
  return `/* ${name} — light */\n:root {\n${block(c)}\n}\n\n/* ${name} — dark (derived) */\n@media (prefers-color-scheme: dark) {\n  :root {\n${block(d).replace(/^/gm, "  ")}\n  }\n}\n[data-theme="dark"] {\n${block(d)}\n}`;
}

export function exportJson(c: PaletteColors): string {
  return JSON.stringify({ light: c, dark: darkTheme(c) }, null, 2);
}

/** W3C Design Tokens Community Group format ($value/$type). */
export function exportDtcg(c: PaletteColors): string {
  const group = (x: PaletteColors) => Object.fromEntries(ROLES.map((r) => [r, { $type: "color", $value: x[r] }]));
  return JSON.stringify({ color: { light: group(c), dark: group(darkTheme(c)) } }, null, 2);
}

export function exportTailwind(c: PaletteColors): string {
  return `// tailwind.config.js (v3) — or map to @theme in Tailwind v4\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${ROLES.map((r) => `        ${r}: "${c[r]}",`).join("\n")}\n      },\n    },\n  },\n};`;
}

export interface Semantic { success: string; warning: string; danger: string; info: string }
/** Status colors tuned to pass 4.5:1 on the given background. Hues are fixed conventions (green/amber/red/blue), not brand hues. */
export function semanticColors(background: string): Semantic {
  const make = (h: number, sat: number) => ensureContrast(hslToHex(h, sat, 40), background, 4.5);
  return { success: make(142, 60), warning: make(38, 85), danger: make(4, 70), info: make(212, 70) };
}
