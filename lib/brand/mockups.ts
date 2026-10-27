// Application previews and construction diagrams as vector scenes (same IR as the logos, so preview == export).
import { circle, group, rect, type Shape, type Vec } from "../vector/ir";
import { mix } from "../library/vec";
import { renderLogo, type Fonts, type LogoRender } from "./render";
import type { ConceptSpec, Layout, Scheme } from "./types";

const embed = (r: LogoRender, x: number, y: number, h: number): Shape => group(r.vec.shapes, { tx: x, ty: y, sx: h / r.vec.h });
const embedW = (r: LogoRender, x: number, y: number, w: number): Shape => group(r.vec.shapes, { tx: x, ty: y, sx: w / r.vec.w });

export type MockupId = "card" | "icon" | "header" | "avatar";
export const MOCKUPS: { id: MockupId; label: string }[] = [{ id: "card", label: "Business card" }, { id: "icon", label: "App icon" }, { id: "header", label: "Website header" }, { id: "avatar", label: "Social avatar" }];

export function mockup(id: MockupId, spec: ConceptSpec, f: Fonts): Vec {
  const P = spec.palette, paper = "#ffffff", table = mix(P.bg, "#888888", 0.18);
  const full = (l: Layout) => renderLogo(spec, l, "full", f);
  switch (id) {
    case "card": {
      const front = full("primary"), back = renderLogo(spec, "symbol", "reversed", f);
      const bars = (x: number, y: number, c: string): Shape[] => [rect(x, y, 90, 6, { fill: c }, 3), rect(x, y + 14, 120, 5, { fill: mix(c, "#ffffff", 0.45) }, 2.5), rect(x, y + 26, 100, 5, { fill: mix(c, "#ffffff", 0.45) }, 2.5)];
      return { w: 760, h: 280, bg: table, title: "Business card mockup", shapes: [
        rect(30, 40, 330, 200, { fill: paper, stroke: mix(table, "#000000", 0.12), sw: 1 }, 10), embedW(front, 50, 56, Math.min(210, front.vec.w * 1.2)), ...bars(52, 180, P.ink),
        rect(400, 40, 330, 200, { fill: P.deep }, 10), embed(back, 400 + 165 - 52, 140 - 52, 104)] };
    }
    case "icon": {
      const sym = renderLogo(spec, "symbol", "reversed", f), sz = 200;
      const tile = (x: number, y: number, s: number): Shape[] => [rect(x, y, s, s, { fill: P.deep }, s * 0.225), embed(sym, x + s * 0.17, y + s * 0.17, s * 0.66)];
      return { w: 400, h: 260, bg: table, title: "App icon mockup", shapes: [...tile(30, 30, sz), ...tile(260, 30, 72), ...tile(260, 120, 44), ...tile(260, 180, 32)] };
    }
    case "header": {
      const lg = full("horizontal");
      const nav = [60, 48, 72, 56].reduce<{ x: number; s: Shape[] }>((a, w) => ({ x: a.x + w + 22, s: [...a.s, rect(a.x, 41, w, 7, { fill: mix(P.ink, P.bg, 0.55) }, 3.5)] }), { x: 360, s: [] }).s;
      return { w: 800, h: 190, bg: table, title: "Website header mockup", shapes: [
        rect(20, 20, 760, 70, { fill: P.bg, stroke: mix(P.bg, "#000000", 0.12), sw: 1 }, 8), embed(lg, 32, 24, 62), ...nav, rect(668, 36, 92, 28, { fill: P.ink }, 14),
        rect(60, 120, 300, 12, { fill: mix(P.ink, P.bg, 0.2) }, 6), rect(60, 144, 220, 8, { fill: mix(P.ink, P.bg, 0.65) }, 4)] };
    }
    default: {
      const sym = renderLogo(spec, "symbol", "reversed", f);
      return { w: 360, h: 220, bg: table, title: "Social avatar mockup", shapes: [circle(110, 110, 80, { fill: P.deep }), embed(sym, 110 - 52, 110 - 52, 104), rect(230, 50, 100, 100, { fill: P.deep }, 14), embed(sym, 244, 64, 72), rect(230, 170, 100, 8, { fill: mix(P.ink, P.bg, 0.6) }, 4)] };
    }
  }
}

/** Clear-space diagram: the zone around the logo equals x = a quarter of the symbol height. */
export function clearSpace(spec: ConceptSpec, f: Fonts, layout: Layout = "primary"): Vec {
  const r = renderLogo(spec, layout, "full", f), x = r.pad, m = 14, c = r.content;
  const zone = mix(spec.palette.accent, "#ffffff", 0.82), edge = spec.palette.accent;
  const W = r.vec.w + m * 2, H = r.vec.h + m * 2;
  const markers: Shape[] = [rect(m, m + r.pad + c.h / 2 - x / 2, x, x, { stroke: edge, sw: 1 }), rect(m + r.vec.w - x, m + r.pad + c.h / 2 - x / 2, x, x, { stroke: edge, sw: 1 }), rect(m + r.pad + c.w / 2 - x / 2, m, x, x, { stroke: edge, sw: 1 }), rect(m + r.pad + c.w / 2 - x / 2, m + r.vec.h - x, x, x, { stroke: edge, sw: 1 })];
  return { w: W, h: H, bg: "#ffffff", title: "Clear space diagram", shapes: [rect(m, m, r.vec.w, r.vec.h, { fill: zone }), rect(m + x, m + x, c.w, c.h, { fill: "#ffffff", stroke: edge, sw: 1 }), group(r.vec.shapes, { tx: m, ty: m }), ...markers] };
}
