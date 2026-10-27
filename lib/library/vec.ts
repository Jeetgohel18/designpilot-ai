import { hexToRgb, readableOn, rgbToHex } from "../color";
import { circle, line, rect, text, type Shape, type Vec } from "../vector/ir";
import { iconShapes } from "./icons";
import type { Cfg, Ctx, Measure } from "./types";

export const mix = (a: string, b: string, t: number) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex({ r: x.r * (1 - t) + y.r * t, g: x.g * (1 - t) + y.g * t, b: x.b * (1 - t) + y.b * t }); };
export const onColor = (c: string) => readableOn(c);

export interface BtnLook { bg: string | null; fg: string; border: string | null }
export function btnLook(variant: string, ctx: Ctx): BtnLook {
  const c = ctx.colors;
  switch (variant) {
    case "secondary": return { bg: c.surface, fg: c.text, border: c.border };
    case "tertiary": return { bg: mix(c.surface, c.primary, 0.12), fg: c.primary, border: null };
    case "ghost": return { bg: null, fg: c.text, border: null };
    case "danger": case "destructive": return { bg: ctx.sem.danger, fg: onColor(ctx.sem.danger), border: null };
    default: return { bg: c.primary, fg: onColor(c.primary), border: null };
  }
}
export const BTN_H = { sm: 36, md: 44, lg: 52 } as const;
export const BTN_FS = { sm: 13, md: 14, lg: 16 } as const;
export const BTN_PX = { sm: 14, md: 20, lg: 26 } as const;

/** A button drawn as vector shapes at (x, y). Returns shapes and the width used. */
export function buttonShapes(label: string, variant: string, size: "sm" | "md" | "lg", iconName: string | null, pos: Cfg["iconPos"], ctx: Ctx, m: Measure, x: number, y: number, disabled = false): { shapes: Shape[]; w: number; h: number } {
  const look = btnLook(variant, ctx), h = BTN_H[size], fs = BTN_FS[size], px = BTN_PX[size];
  const ic = iconName && pos !== "none" ? fs + 4 : 0, gap = ic ? 8 : 0;
  const tw = m(label, fs, 600, "body"), w = Math.round(px * 2 + tw + ic + gap);
  const shapes: Shape[] = [];
  const op = disabled ? 0.45 : 1;
  const fade = (c: string) => (disabled ? mix(c, ctx.colors.background, 0.55) : c);
  if (look.bg || look.border) shapes.push(rect(x + 0.5, y + 0.5, w - 1, h - 1, { fill: look.bg ? fade(look.bg) : null, stroke: look.border ? fade(look.border) : null, sw: 1 }, ctx.radius));
  let cx = x + px;
  const ty = y + h / 2 + fs * 0.35;
  if (iconName && pos === "left") { shapes.push(...iconShapes(iconName, cx, y + h / 2 - ic / 2, ic, fade(look.fg))); cx += ic + gap; }
  shapes.push(text(cx, ty, label, fs, ctx.body, fade(look.fg), { weight: 600 }));
  cx += tw + gap;
  if (iconName && pos === "right") shapes.push(...iconShapes(iconName, cx, y + h / 2 - ic / 2, ic, fade(look.fg)));
  void op;
  return { shapes, w, h };
}

export const swatchShapes = (x: number, y: number, w: number, h: number, fill: string, ctx: Ctx, label: string, hex: string): Shape[] => [
  rect(x + 0.5, y + 0.5, w - 1, h - 1, { fill: ctx.colors.surface, stroke: ctx.colors.border, sw: 1 }, ctx.radius),
  rect(x + 1, y + 1, w - 2, h - 46, { fill }, Math.max(0, ctx.radius - 1)),
  text(x + 10, y + h - 26, label, 13, ctx.body, ctx.colors.text, { weight: 700 }),
  text(x + 10, y + h - 10, hex.toUpperCase(), 11, ctx.body, mix(ctx.colors.text, ctx.colors.surface, 0.4)),
];

export const sheet = (w: number, h: number, ctx: Ctx, shapes: Shape[], title: string): Vec => ({ w, h, bg: ctx.colors.background, shapes, title });
export { circle, line };
