// Symbol motifs drawn in a 100×100 box. Parts never overlap, so a one-colour version
// (black / white) keeps every part readable.
import { applyTf, arc, circle, group, path, rect, type Cmd, type Shape } from "../vector/ir";
import type { MotifId } from "./types";

export interface Cols { a: string; b: string }
export interface Motif { label: string; noun: string; meaning: string; draw(c: Cols, seed: number): Shape[] }

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
const rotate = (shapes: Shape[], deg: number): Shape[] => (deg ? [group([group(shapes, { tx: -50, ty: -50 })], { tx: 50, ty: 50, rot: deg })] : shapes);
const mirror = (shapes: Shape[], on: boolean): Shape[] => (on ? [group(shapes, { tx: 100, sx: -1, sy: 1 })] : shapes);
const quarter = (cx: number, cy: number, a0: number, r: number, fill: string): Shape => { const [x, y] = polar(cx, cy, r, a0); return path([["M", cx, cy], ["L", x, y], ...arc(cx, cy, r, a0, a0 + 90, false), ["Z"]], { fill }); };

export const MOTIFS: Record<MotifId, Motif> = {
  orbit: {
    label: "Orbit", noun: "orbit with a satellite", meaning: "A core with a satellite: connection, community, focus.",
    draw: (c, s) => { const [x, y] = polar(50, 50, 40, [-45, 45, 135, 225][s % 4]); return [circle(50, 50, 26, { fill: c.a }), circle(x, y, 9, { fill: c.b })]; },
  },
  petal: {
    label: "Petals", noun: "four-petal flower", meaning: "Four leaf shapes turning around a centre: growth, care, natural materials.",
    draw: (c, s) => {
      const leaf: Cmd[] = applyTf([["M", 50, 46], ["C", 24, 38, 26, 10, 50, 6], ["C", 74, 10, 76, 38, 50, 46], ["Z"]], { tx: -50, ty: -50 });
      return [0, 1, 2, 3].map((k) => path(applyTf(leaf, { tx: 50, ty: 50, rot: k * 90 }), { fill: k === s % 4 ? c.b : c.a }));
    },
  },
  stack: {
    label: "Stack", noun: "stack of bars", meaning: "Layers stepping down: structure, progress, systems.",
    draw: (c, s) => [84, 58, 32].map((w, i) => rect(s % 2 ? 50 - w / 2 : 8, 16 + i * 28, w, 18, { fill: i === 2 ? c.b : c.a }, 4)),
  },
  quarters: {
    label: "Quarters", noun: "grid of quarter shapes", meaning: "A grid of simple parts: modularity, balance, craft.",
    draw: (c, s) => rotate([quarter(4, 4, 0, 42, c.a), rect(54, 4, 42, 42, { fill: c.b }, 6), rect(4, 54, 42, 42, { fill: c.a }, 6), quarter(96, 96, 180, 42, c.a)], (s % 4) * 90),
  },
  diamond: {
    label: "Facet", noun: "faceted diamond", meaning: "A cut form with a centre: precision, value, clarity.",
    draw: (c) => [
      path([["M", 50, 4], ["L", 96, 50], ["L", 50, 96], ["L", 4, 50], ["Z"], ["M", 50, 24], ["L", 24, 50], ["L", 50, 76], ["L", 76, 50], ["Z"]], { fill: c.a, fr: "evenodd" }),
      path([["M", 50, 38], ["L", 62, 50], ["L", 50, 62], ["L", 38, 50], ["Z"]], { fill: c.b }),
    ],
  },
  wave: {
    label: "Wave", noun: "pair of waves", meaning: "Two flowing lines: movement, flexibility, water and air.",
    draw: (c, s) => { const f = s % 2 ? -1 : 1; const w = (y: number): Cmd[] => [["M", 10, y], ["C", 30, y - 22 * f, 40, y - 22 * f, 50, y], ["C", 60, y + 22 * f, 70, y + 22 * f, 90, y]]; return [path(w(36), { stroke: c.a, sw: 14, cap: "round" }), path(w(68), { stroke: c.b, sw: 14, cap: "round" })]; },
  },
  peak: {
    label: "Peaks", noun: "pair of peaks", meaning: "Two rising forms: ambition, outdoors, reaching a goal.",
    draw: (c, s) => mirror([path([["M", 6, 88], ["L", 44, 16], ["L", 72, 88], ["Z"]], { fill: c.a }), path([["M", 79, 88], ["L", 96, 88], ["L", 87, 52], ["Z"]], { fill: c.b })], s % 2 === 1),
  },
  spark: {
    label: "Spark", noun: "four-point spark", meaning: "A four-point star: ideas, highlights, light.",
    draw: (c, s) => { const [x, y] = polar(50, 50, 45, [-45, 45, 135, 225][s % 4]); return [path([["M", 50, 14], ["C", 52, 38, 62, 48, 86, 50], ["C", 62, 52, 52, 62, 50, 86], ["C", 48, 62, 38, 52, 14, 50], ["C", 38, 48, 48, 38, 50, 14], ["Z"]], { fill: c.a }), circle(x, y, 6, { fill: c.b })]; },
  },
};
export const MOTIF_IDS = Object.keys(MOTIFS) as MotifId[];
