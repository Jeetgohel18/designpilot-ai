export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(v)) return null;
  return "#" + v.toUpperCase();
}

export function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex) ?? "#000000";
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}

export function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const S = clamp(s, 0, 100) / 100, L = clamp(l, 0, 100) / 100;
  const H = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const x = c * (1 - Math.abs(((H / 60) % 2) - 1));
  const m = L - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (H < 60) [r, g, b] = [c, x, 0];
  else if (H < 120) [r, g, b] = [x, c, 0];
  else if (H < 180) [r, g, b] = [0, c, x];
  else if (H < 240) [r, g, b] = [0, x, c];
  else if (H < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export const hslToHex = (h: number, s: number, l: number) => rgbToHex(hslToRgb({ h, s, l }));
export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex));
export const rgbString = (hex: string) => { const { r, g, b } = hexToRgb(hex); return `rgb(${r}, ${g}, ${b})`; };
export const hslString = (hex: string) => { const { h, s, l } = hexToHsl(hex); return `hsl(${h}, ${s}%, ${l}%)`; };

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio, 1–21. */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function wcagRating(ratio: number): { aa: boolean; aaLarge: boolean; aaa: boolean; label: string } {
  return {
    aa: ratio >= 4.5, aaLarge: ratio >= 3, aaa: ratio >= 7,
    label: ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA Large" : "Fail",
  };
}

/** Best readable text color (near-black or white) for a background. */
export function readableOn(bg: string, dark = "#0B0B0E", light = "#FFFFFF"): string {
  return contrast(bg, dark) >= contrast(bg, light) ? dark : light;
}

/** Nudge lightness of `fg` until it reaches `target` contrast against `bg`. */
export function ensureContrast(fg: string, bg: string, target = 4.5): string {
  if (contrast(fg, bg) >= target) return fg;
  const { h, s, l } = hexToHsl(fg);
  const bgDark = luminance(bg) < 0.4;
  for (let step = 1; step <= 100; step++) {
    const nl = clamp(l + (bgDark ? step : -step), 0, 100);
    const c = hslToHex(h, s, nl);
    if (contrast(c, bg) >= target) return c;
  }
  return bgDark ? "#FFFFFF" : "#000000";
}
