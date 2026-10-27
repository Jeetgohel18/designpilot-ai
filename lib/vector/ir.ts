// A tiny vector scene description ("IR") rendered to BOTH SVG and PDF, so an exported logo/component is the same
// artwork in every vector format. Coordinates: origin top-left, y down. Only hex colors are accepted.

export type Cmd = ["M", number, number] | ["L", number, number] | ["C", number, number, number, number, number, number] | ["Z"];
export interface Paint { fill?: string | null; stroke?: string | null; sw?: number; fr?: "evenodd"; cap?: "round" | "butt" | "square"; join?: "round" | "miter" | "bevel" }
export interface Tf { tx?: number; ty?: number; rot?: number; sx?: number; sy?: number } // rot in degrees about the origin (applied after scale)

export type Shape =
  | ({ t: "rect"; x: number; y: number; w: number; h: number; rx?: number } & Paint)
  | ({ t: "circle"; cx: number; cy: number; r: number } & Paint)
  | ({ t: "path"; d: Cmd[] } & Paint)
  | ({ t: "line"; x1: number; y1: number; x2: number; y2: number } & Paint)
  | { t: "text"; x: number; y: number; text: string; size: number; family: string; weight?: number; anchor?: "start" | "middle" | "end"; tracking?: number; fill: string }
  | { t: "g"; children: Shape[]; tf?: Tf };

export interface Vec { w: number; h: number; bg?: string | null; shapes: Shape[]; title?: string; desc?: string }

const HEX = /^#[0-9a-fA-F]{3,8}$/;
export const color = (c: string | null | undefined): string | null => (c && HEX.test(c) ? c : null);
const n = (v: number) => (Number.isFinite(v) ? String(Math.round(v * 1000) / 1000) : "0");
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- constructors
export const rect = (x: number, y: number, w: number, h: number, p: Paint = {}, rx = 0): Shape => ({ t: "rect", x, y, w, h, rx, ...p });
export const circle = (cx: number, cy: number, r: number, p: Paint = {}): Shape => ({ t: "circle", cx, cy, r, ...p });
export const path = (d: Cmd[], p: Paint = {}): Shape => ({ t: "path", d, ...p });
export const line = (x1: number, y1: number, x2: number, y2: number, p: Paint = {}): Shape => ({ t: "line", x1, y1, x2, y2, ...p });
export const text = (x: number, y: number, s: string, size: number, family: string, fill: string, o: { weight?: number; anchor?: "start" | "middle" | "end"; tracking?: number } = {}): Shape => ({ t: "text", x, y, text: s, size, family, fill, ...o });
export const group = (children: Shape[], tf?: Tf): Shape => ({ t: "g", children, tf });

/** Circular arc as cubic Béziers (≤90° segments). Angles in degrees, clockwise on screen (y down). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, moveTo = true): Cmd[] {
  const out: Cmd[] = [];
  const total = a1 - a0, segs = Math.max(1, Math.ceil(Math.abs(total) / 90)), step = total / segs;
  const rad = (d: number) => (d * Math.PI) / 180;
  const pt = (a: number): [number, number] => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];
  const [sx, sy] = pt(a0);
  if (moveTo) out.push(["M", sx, sy]);
  for (let i = 0; i < segs; i++) {
    const s = a0 + i * step, e = s + step, k = (4 / 3) * Math.tan(rad(e - s) / 4);
    const [x0, y0] = pt(s), [x1, y1] = pt(e);
    out.push(["C", x0 - k * r * Math.sin(rad(s)), y0 + k * r * Math.cos(rad(s)), x1 + k * r * Math.sin(rad(e)), y1 - k * r * Math.cos(rad(e)), x1, y1]);
  }
  return out;
}
export const circlePath = (cx: number, cy: number, r: number): Cmd[] => [...arc(cx, cy, r, 0, 360), ["Z"]];
export const roundRectPath = (x: number, y: number, w: number, h: number, r: number): Cmd[] => {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r === 0) return [["M", x, y], ["L", x + w, y], ["L", x + w, y + h], ["L", x, y + h], ["Z"]];
  const k = r * 0.5522847498;
  return [["M", x + r, y], ["L", x + w - r, y], ["C", x + w - r + k, y, x + w, y + r - k, x + w, y + r], ["L", x + w, y + h - r], ["C", x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h], ["L", x + r, y + h], ["C", x + r - k, y + h, x, y + h - r + k, x, y + h - r], ["L", x, y + r], ["C", x, y + r - k, x + r - k, y, x + r, y], ["Z"]];
};

// ---- transforms
export function applyTf(d: Cmd[], tf: Tf): Cmd[] {
  const sx = tf.sx ?? 1, sy = tf.sy ?? tf.sx ?? 1, a = ((tf.rot ?? 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const P = (x: number, y: number): [number, number] => { const X = x * sx, Y = y * sy; return [X * c - Y * s + (tf.tx ?? 0), X * s + Y * c + (tf.ty ?? 0)]; };
  return d.map((cmd) => {
    if (cmd[0] === "Z") return cmd;
    if (cmd[0] === "C") { const p1 = P(cmd[1], cmd[2]), p2 = P(cmd[3], cmd[4]), p3 = P(cmd[5], cmd[6]); return ["C", ...p1, ...p2, ...p3] as Cmd; }
    const p = P(cmd[1], cmd[2]); return [cmd[0], ...p] as Cmd;
  });
}
const tfAttr = (tf?: Tf) => {
  if (!tf) return "";
  const parts = [`translate(${n(tf.tx ?? 0)} ${n(tf.ty ?? 0)})`];
  if (tf.rot) parts.push(`rotate(${n(tf.rot)})`);
  if (tf.sx !== undefined || tf.sy !== undefined) parts.push(`scale(${n(tf.sx ?? 1)} ${n(tf.sy ?? tf.sx ?? 1)})`);
  return ` transform="${parts.join(" ")}"`;
};

export const pathData = (d: Cmd[]) => d.map((c) => c[0] + (c.length > 1 ? c.slice(1).map((v) => n(v as number)).join(" ") : "")).join("");

function paintAttrs(p: Paint, defaultFill: string | null = null): string {
  const fill = p.fill === undefined ? defaultFill : p.fill;
  let s = ` fill="${color(fill) ?? "none"}"`;
  const st = color(p.stroke);
  if (st) s += ` stroke="${st}" stroke-width="${n(p.sw ?? 1)}"${p.cap ? ` stroke-linecap="${p.cap}"` : ""}${p.join ? ` stroke-linejoin="${p.join}"` : ""}`;
  if (p.fr === "evenodd") s += ` fill-rule="evenodd" clip-rule="evenodd"`;
  return s;
}

function shapeSvg(s: Shape, pad: string): string {
  switch (s.t) {
    case "rect": return `${pad}<rect x="${n(s.x)}" y="${n(s.y)}" width="${n(s.w)}" height="${n(s.h)}"${s.rx ? ` rx="${n(s.rx)}"` : ""}${paintAttrs(s)}/>`;
    case "circle": return `${pad}<circle cx="${n(s.cx)}" cy="${n(s.cy)}" r="${n(s.r)}"${paintAttrs(s)}/>`;
    case "path": return `${pad}<path d="${pathData(s.d)}"${paintAttrs(s)}/>`;
    case "line": return `${pad}<line x1="${n(s.x1)}" y1="${n(s.y1)}" x2="${n(s.x2)}" y2="${n(s.y2)}"${paintAttrs({ ...s, fill: null })}/>`;
    case "text": return `${pad}<text x="${n(s.x)}" y="${n(s.y)}" font-family="${esc(`'${s.family}', sans-serif`)}" font-size="${n(s.size)}" font-weight="${s.weight ?? 400}"${s.anchor && s.anchor !== "start" ? ` text-anchor="${s.anchor}"` : ""}${s.tracking ? ` letter-spacing="${n(s.tracking)}"` : ""} fill="${color(s.fill) ?? "#000000"}">${esc(s.text)}</text>`;
    case "g": return `${pad}<g${tfAttr(s.tf)}>\n${s.children.map((c) => shapeSvg(c, pad + "  ")).join("\n")}\n${pad}</g>`;
  }
}

/** Valid, standalone SVG 1.1 markup. Text elements are live text unless the scene was outlined first. */
export function toSvg(v: Vec): string {
  const bg = color(v.bg);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(v.w)}" height="${n(v.h)}" viewBox="0 0 ${n(v.w)} ${n(v.h)}" role="img">\n  <title>${esc(v.title ?? "Vector artwork")}</title>${v.desc ? `\n  <desc>${esc(v.desc)}</desc>` : ""}\n${bg ? `  <rect width="${n(v.w)}" height="${n(v.h)}" fill="${bg}"/>\n` : ""}${v.shapes.map((s) => shapeSvg(s, "  ")).join("\n")}\n</svg>\n`;
}

export const hasText = (shapes: Shape[]): boolean => shapes.some((s) => s.t === "text" || (s.t === "g" && hasText(s.children)));

type M = [number, number, number, number, number, number]; // [a b c d e f]: x' = a x + c y + e ; y' = b x + d y + f
const IDENT: M = [1, 0, 0, 1, 0, 0];
const mul = (p: M, c: M): M => [p[0] * c[0] + p[2] * c[1], p[1] * c[0] + p[3] * c[1], p[0] * c[2] + p[2] * c[3], p[1] * c[2] + p[3] * c[3], p[0] * c[4] + p[2] * c[5] + p[4], p[1] * c[4] + p[3] * c[5] + p[5]];
/** SVG order: translate · rotate · scale. */
export function tfMatrix(tf?: Tf): M {
  if (!tf) return IDENT;
  const sx = tf.sx ?? 1, sy = tf.sy ?? tf.sx ?? 1, a = ((tf.rot ?? 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [c * sx, s * sx, -s * sy, c * sy, tf.tx ?? 0, tf.ty ?? 0];
}
const applyM = (d: Cmd[], m: M): Cmd[] => {
  const P = (x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  return d.map((cmd): Cmd => {
    if (cmd[0] === "Z") return cmd;
    if (cmd[0] === "C") return ["C", ...P(cmd[1], cmd[2]), ...P(cmd[3], cmd[4]), ...P(cmd[5], cmd[6])];
    return [cmd[0], ...P(cmd[1], cmd[2])];
  });
};

/** Flatten a scene into absolute-coordinate paths (group transforms baked in). Text shapes are returned untouched (outline them first). */
export function flatten(shapes: Shape[], tf?: Tf): Shape[] {
  const out: Shape[] = [];
  const walk = (list: Shape[], m: M) => {
    for (const s of list) {
      if (s.t === "g") { walk(s.children, mul(m, tfMatrix(s.tf))); continue; }
      if (s.t === "text") { out.push(s); continue; }
      const d = s.t === "rect" ? roundRectPath(s.x, s.y, s.w, s.h, s.rx ?? 0) : s.t === "circle" ? circlePath(s.cx, s.cy, s.r) : s.t === "line" ? ([["M", s.x1, s.y1], ["L", s.x2, s.y2]] as Cmd[]) : s.d;
      const scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
      out.push({ t: "path", d: applyM(d, m), fill: s.t === "line" ? null : s.fill, stroke: s.stroke, sw: s.sw !== undefined ? s.sw * scale : s.stroke ? scale : undefined, fr: s.fr, cap: s.cap, join: s.join });
    }
  };
  walk(shapes, mul(IDENT, tfMatrix(tf)));
  return out;
}
