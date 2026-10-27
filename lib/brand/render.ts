// Turns a ConceptSpec into vector artwork (the shared Vec IR → SVG / PDF / PNG). Pure functions.
import { arc, circle, group, line, path, rect, roundRectPath, text, type Cmd, type Shape, type Vec } from "../vector/ir";
import { outlineString, textWidth, type FontResolver } from "../vector/text";
import { MOTIFS } from "./motifs";
import type { ArchetypeId, ConceptSpec, Layout, Scheme } from "./types";

/** Font access. Without a loaded font, widths are estimated and the negative-space knockout falls back to a plain letter. */
export interface Fonts { glyph: FontResolver }
export const NO_FONTS: Fonts = { glyph: () => undefined };

export interface Cols { ink: string; accent: string; bg: string | null; knock: string }
export function schemeCols(spec: ConceptSpec, scheme: Scheme): Cols {
  const p = spec.palette;
  switch (scheme) {
    case "reversed": return { ink: p.bg, accent: p.accent, bg: p.deep, knock: p.deep };
    case "black": return { ink: "#000000", accent: "#000000", bg: null, knock: "#ffffff" };
    case "white": return { ink: "#ffffff", accent: "#ffffff", bg: null, knock: "#000000" };
    default: return { ink: p.ink, accent: p.accent, bg: null, knock: p.bg };
  }
}

export interface ArchDef { id: ArchetypeId; label: string; primary: Layout; hasSymbol: boolean }
export const ARCH: Record<ArchetypeId, ArchDef> = {
  wordmark: { id: "wordmark", label: "Wordmark", primary: "wordmark", hasSymbol: false },
  monogram: { id: "monogram", label: "Monogram", primary: "horizontal", hasSymbol: true },
  geometric: { id: "geometric", label: "Abstract geometric mark", primary: "horizontal", hasSymbol: true },
  letterform: { id: "letterform", label: "Letterform mark", primary: "horizontal", hasSymbol: true },
  negative: { id: "negative", label: "Negative-space monogram", primary: "horizontal", hasSymbol: true },
  emblem: { id: "emblem", label: "Emblem / badge", primary: "stacked", hasSymbol: true },
  combo: { id: "combo", label: "Symbol + wordmark", primary: "horizontal", hasSymbol: true },
  minimal: { id: "minimal", label: "Minimalist mark", primary: "horizontal", hasSymbol: true },
  editorial: { id: "editorial", label: "Editorial / luxury wordmark", primary: "wordmark", hasSymbol: false },
  technical: { id: "technical", label: "Technical / futuristic", primary: "horizontal", hasSymbol: true },
};

export const labelOf = (s: ConceptSpec) => (s.caps ? s.name.toUpperCase() : s.name);
const font = (f: Fonts, s: ConceptSpec) => f.glyph(s.font.family, s.font.weight);
const wWidth = (f: Fonts, s: ConceptSpec, str: string, size: number) => textWidth(font(f, s), str, size, s.tracking * size, s.font.weight >= 600);
const centeredLetter = (spec: ConceptSpec, f: Fonts, str: string, cx: number, cy: number, size: number, fill: string): Shape =>
  text(cx, cy + size * 0.35, str, size, spec.font.family, fill, { weight: spec.font.weight, anchor: "middle" });

// ---- symbols (100×100 box)
function lcg(seed: number) { let x = (seed * 2654435761) >>> 0; return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296); }

function symbolShapes(spec: ConceptSpec, c: Cols, f: Fonts, forceMono = false): Shape[] {
  const a = spec.archetype, ini = spec.initials;
  const mono = (): Shape[] => [
    circle(50, 50, 46, { stroke: c.ink, sw: 5 }),
    centeredLetter(spec, f, ini.slice(0, 2), 50, 50, ini.length > 1 ? 36 : 50, c.ink),
  ];
  if (forceMono) return mono();
  switch (a) {
    case "monogram": {
      const kind = spec.seed % 3;
      const frame: Shape = kind === 0 ? circle(50, 50, 46, { stroke: c.ink, sw: 5 }) : kind === 1 ? rect(6, 6, 88, 88, { stroke: c.ink, sw: 5 }, 22) : path([["M", 8, 94], ["L", 8, 50], ...arc(50, 50, 42, 180, 360, false), ["L", 92, 94], ["Z"]], { stroke: c.ink, sw: 5, join: "round" });
      return [frame, centeredLetter(spec, f, ini.slice(0, 2), 50, kind === 2 ? 58 : 50, ini.length > 1 ? 36 : 50, c.ink), circle(50, 88, 3.5, { fill: c.accent })];
    }
    case "letterform": {
      const l = ini.slice(0, 1);
      const accents: Shape[][] = [[circle(86, 86, 9, { fill: c.accent })], [rect(14, 92, 72, 6, { fill: c.accent }, 3)], [rect(70, 6, 6, 70, { fill: c.accent }, 3)]];
      return [centeredLetter(spec, f, l, 46, 50, 96, c.ink), ...accents[spec.seed % 3]];
    }
    case "negative": {
      const l = ini.slice(0, 1), gf = font(f, spec);
      const box = roundRectPath(4, 4, 92, 92, [22, 46, 10][spec.seed % 3]);
      if (gf) { const size = 64; const g = outlineString(gf, l, 50, 50 + size * 0.35, size, 0, "middle").d; return [path([...box, ...g], { fill: c.ink, fr: "evenodd" })]; }
      return [path(box, { fill: c.ink }), centeredLetter(spec, f, l, 50, 50, 64, c.knock)];
    }
    case "emblem":
      return [circle(50, 50, 47, { stroke: c.ink, sw: 4 }), circle(50, 50, 38, { stroke: c.accent, sw: 1.6 }), centeredLetter(spec, f, ini.slice(0, 2), 50, 50, ini.length > 1 ? 34 : 44, c.ink)];
    case "minimal": {
      const arcD: Cmd[] = arc(50, 50, 40, [-90, 0, 90, 180][spec.seed % 4], [-90, 0, 90, 180][spec.seed % 4] + 270, true);
      return [circle(50, 50, 20, { fill: c.ink }), path(arcD, { stroke: c.accent, sw: 5, cap: "round" })];
    }
    case "technical": {
      const r = lcg(spec.seed + 7); const cells: boolean[] = []; for (let i = 0; i < 9; i++) cells.push(false);
      for (let row = 0; row < 3; row++) { const m = r() > 0.4, e = r() > 0.35; cells[row * 3] = m; cells[row * 3 + 1] = e; cells[row * 3 + 2] = m; }
      cells[4] = true; if (cells.filter(Boolean).length < 5) { cells[1] = true; cells[7] = true; }
      const out: Shape[] = []; let hot = false;
      cells.forEach((on, i) => { if (!on) return; const x = 6 + (i % 3) * 31, y = 6 + Math.floor(i / 3) * 31; const isHot = !hot && i === 4; hot = hot || isHot; out.push(rect(x, y, 26, 26, { fill: isHot ? c.accent : c.ink }, 3)); });
      return out;
    }
    case "wordmark": case "editorial": return mono();
    default: return MOTIFS[spec.motif].draw({ a: c.ink, b: c.accent }, spec.seed);
  }
}

// ---- wordmark part: local box, top-left origin
interface Part { shapes: Shape[]; w: number; h: number }
function wordmark(spec: ConceptSpec, c: Cols, size: number, f: Fonts): Part {
  const s = labelOf(spec), w = wWidth(f, spec, s, size);
  const base = size * 0.78;
  const t = (x: number): Shape => text(x, base, s, size, spec.font.family, c.ink, { weight: spec.font.weight, tracking: spec.tracking * size });
  if (spec.archetype === "editorial") {
    const pad = size * 0.5, sw = Math.max(0.8, size * 0.035);
    return { shapes: [line(0, 0, w, 0, { stroke: c.ink, sw }), text(0, pad + base, s, size, spec.font.family, c.ink, { weight: spec.font.weight, tracking: spec.tracking * size }), line(0, pad * 2 + size, w, pad * 2 + size, { stroke: c.accent, sw })], w, h: pad * 2 + size };
  }
  if (spec.archetype === "technical") {
    const sw = Math.max(1.2, size * 0.07), arm = size * 0.35, gap = size * 0.5, h = size * 1.1, y0 = (h - size) / 2;
    const W = w + gap * 2;
    return { shapes: [path([["M", arm, 0], ["L", 0, 0], ["L", 0, h], ["L", arm, h]], { stroke: c.accent, sw, join: "miter" }), text(gap, y0 + base, s, size, spec.font.family, c.ink, { weight: spec.font.weight, tracking: spec.tracking * size }), path([["M", W - arm, 0], ["L", W, 0], ["L", W, h], ["L", W - arm, h]], { stroke: c.accent, sw, join: "miter" })], w: W, h };
  }
  if (spec.archetype === "wordmark") {
    const r = size * 0.075;
    return { shapes: [t(0), circle(w + r * 2.2, base - r, r, { fill: c.accent })], w: w + r * 4.4, h: size };
  }
  return { shapes: [t(0)], w, h: size };
}

export interface LogoRender { vec: Vec; content: { x: number; y: number; w: number; h: number }; pad: number; layout: Layout; scheme: Scheme }
const place = (shapes: Shape[], x: number, y: number, k = 1): Shape => group(shapes, { tx: x, ty: y, sx: k });

export function renderLogo(spec: ConceptSpec, layoutIn: Layout, scheme: Scheme, fonts: Fonts = NO_FONTS): LogoRender {
  const def = ARCH[spec.archetype], c = schemeCols(spec, scheme);
  let layout: Layout = layoutIn === "primary" ? def.primary : layoutIn;
  const wordOnly = !def.hasSymbol;
  // Wordmark-only concepts have no separate symbol; their symbol/lockups use a compact monogram so every variant still exists.
  const sym = (): Shape[] => symbolShapes(spec, c, fonts, wordOnly);
  let parts: { shapes: Shape[]; w: number; h: number };
  const S = 100;
  if (layout === "symbol") parts = { shapes: sym(), w: S, h: S };
  else if (layout === "wordmark" || (wordOnly && layout !== "stacked" && layout !== "horizontal")) { layout = "wordmark"; const wm = wordmark(spec, c, 64, fonts); parts = { shapes: [place(wm.shapes, 0, 0)], w: wm.w, h: wm.h }; }
  else if (layout === "stacked") {
    const wm = wordmark(spec, c, 38, fonts), gap = 26, W = Math.max(S, wm.w);
    parts = { shapes: [place(sym(), (W - S) / 2, 0), place(wm.shapes, (W - wm.w) / 2, S + gap)], w: W, h: S + gap + wm.h };
  } else {
    layout = "horizontal";
    const wm = wordmark(spec, c, 46, fonts), gap = 28, H = Math.max(S, wm.h);
    parts = { shapes: [place(sym(), 0, (H - S) / 2), place(wm.shapes, S + gap, (H - wm.h) / 2)], w: S + gap + wm.w, h: H };
  }
  const pad = layout === "wordmark" ? parts.h * 0.5 : S / 4;
  const vec: Vec = {
    w: Math.ceil(parts.w + pad * 2), h: Math.ceil(parts.h + pad * 2), bg: c.bg,
    shapes: [place(parts.shapes, pad + (Math.ceil(parts.w + pad * 2) - (parts.w + pad * 2)) / 2, pad)],
    title: `${spec.name} logo — ${def.label}`, desc: `${layout} lockup, ${scheme} colours`,
  };
  return { vec, content: { x: pad, y: pad, w: parts.w, h: parts.h }, pad, layout, scheme };
}

/** Rule-of-thumb minimum sizes derived from the artwork itself (not a legal or tested standard). */
export function minSizes(r: LogoRender): { digitalW: number; digitalH: number; printMm: number } {
  const ratio = r.content.w / r.content.h;
  const h = r.layout === "wordmark" ? 14 : 24;
  return { digitalH: h, digitalW: Math.round(h * ratio), printMm: Math.round(Math.max(10, (h * ratio) / 3.78 + 4)) };
}


/** The logo cropped to its artwork (no clear-space padding), for use inside UI. */
export function trimmed(r: LogoRender): Vec {
  return { w: Math.ceil(r.content.w), h: Math.ceil(r.content.h), bg: null, title: r.vec.title, desc: r.vec.desc, shapes: [group(r.vec.shapes, { tx: -r.pad, ty: -r.pad })] };
}
