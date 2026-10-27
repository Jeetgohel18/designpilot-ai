import type { Cmd, Shape, Vec } from "./ir";

// Approximate Helvetica advance widths (1/1000 em) for ASCII 32–126. Used only when no real font is loaded.
const HELV = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const HELV_B = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];

/** Estimated width in px of `s` set in a Helvetica-like face. */
export function estimateWidth(s: string, size: number, bold = false): number {
  const t = bold ? HELV_B : HELV;
  let w = 0;
  for (const ch of s) { const c = ch.charCodeAt(0); w += c >= 32 && c <= 126 ? t[c - 32] : 600; }
  return (w / 1000) * size;
}
export const helvWidth = (s: string, size: number, bold = false) => estimateWidth(s, size, bold);

/** Minimal view of a parsed font; implemented over opentype.js in wrapOpentype(). */
export interface GlyphFont {
  unitsPerEm: number; ascender: number; descender: number;
  charCmds(ch: string, x: number, y: number, size: number): Cmd[];
  advance(ch: string, size: number): number;
  kern(a: string, b: string, size: number): number;
}
export type FontResolver = (family: string, weight: number) => GlyphFont | undefined;

interface OtGlyph { advanceWidth?: number; getPath(x: number, y: number, size: number): { commands: { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number }[] } }
interface OtFont { unitsPerEm: number; ascender: number; descender: number; charToGlyph(c: string): OtGlyph; getKerningValue?(a: OtGlyph, b: OtGlyph): number }

/** opentype.js 2.x throws on some GSUB lookups when shaping strings, so we lay out glyph by glyph (no ligatures — right for logos). */
export function wrapOpentype(f: OtFont): GlyphFont {
  return {
    unitsPerEm: f.unitsPerEm, ascender: f.ascender, descender: f.descender,
    advance: (ch, size) => ((f.charToGlyph(ch).advanceWidth ?? 0) / f.unitsPerEm) * size,
    kern: (a, b, size) => { try { return ((f.getKerningValue?.(f.charToGlyph(a), f.charToGlyph(b)) ?? 0) / f.unitsPerEm) * size; } catch { return 0; } },
    charCmds: (ch, x, y, size) => {
      const out: Cmd[] = []; let cx = 0, cy = 0;
      for (const c of f.charToGlyph(ch).getPath(x, y, size).commands) {
        if (c.type === "M") { out.push(["M", c.x!, c.y!]); cx = c.x!; cy = c.y!; }
        else if (c.type === "L") { out.push(["L", c.x!, c.y!]); cx = c.x!; cy = c.y!; }
        else if (c.type === "C") { out.push(["C", c.x1!, c.y1!, c.x2!, c.y2!, c.x!, c.y!]); cx = c.x!; cy = c.y!; }
        else if (c.type === "Q") { out.push(["C", cx + (2 / 3) * (c.x1! - cx), cy + (2 / 3) * (c.y1! - cy), c.x! + (2 / 3) * (c.x1! - c.x!), c.y! + (2 / 3) * (c.y1! - c.y!), c.x!, c.y!]); cx = c.x!; cy = c.y!; }
        else if (c.type === "Z") out.push(["Z"]);
      }
      return out;
    },
  };
}

export function textWidth(font: GlyphFont | undefined, s: string, size: number, tracking = 0, bold = false): number {
  const chars = [...s];
  if (!font) return estimateWidth(s, size, bold) + tracking * Math.max(0, chars.length - 1);
  let w = 0;
  chars.forEach((ch, i) => { w += font.advance(ch, size); if (i > 0) w += font.kern(chars[i - 1], ch, size); if (i < chars.length - 1) w += tracking; });
  return w;
}

/** Text → vector outlines (one path per string). Returns the commands and the measured width. */
export function outlineString(font: GlyphFont, s: string, x: number, y: number, size: number, tracking = 0, anchor: "start" | "middle" | "end" = "start"): { d: Cmd[]; width: number } {
  const chars = [...s];
  const width = textWidth(font, s, size, tracking);
  let pen = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const d: Cmd[] = [];
  chars.forEach((ch, i) => {
    if (i > 0) pen += font.kern(chars[i - 1], ch, size);
    if (ch !== " ") d.push(...font.charCmds(ch, pen, y, size));
    pen += font.advance(ch, size) + tracking;
  });
  return { d, width };
}

/** Replace every live text shape by outlines when its font is available. `missing` lists families that couldn't be outlined. */
export function outlineScene(v: Vec, resolve: FontResolver): { vec: Vec; missing: string[] } {
  const missing = new Set<string>();
  const walk = (list: Shape[]): Shape[] => list.map((s): Shape => {
    if (s.t === "g") return { ...s, children: walk(s.children) };
    if (s.t !== "text") return s;
    const font = resolve(s.family, s.weight ?? 400);
    if (!font) { missing.add(s.family); return s; }
    return { t: "path", d: outlineString(font, s.text, s.x, s.y, s.size, s.tracking ?? 0, s.anchor ?? "start").d, fill: s.fill };
  });
  return { vec: { ...v, shapes: walk(v.shapes) }, missing: [...missing] };
}

export const fontKey = (family: string, weight: number) => `${family}@${weight}`;
