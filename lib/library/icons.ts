import { pathData, type Cmd, type Shape } from "../vector/ir";

// One icon set, authored as geometry (24×24 grid, 2px round strokes) so the SAME icon renders as inline SVG markup in
// component HTML and as vector paths in SVG/PDF exports. Paths use absolute M/L/C/Z only.
type Part = { k: "p"; d: Cmd[] } | { k: "c"; cx: number; cy: number; r: number } | { k: "r"; x: number; y: number; w: number; h: number; rx?: number };

function P(d: string): Part {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? []; const cmds: Cmd[] = []; let i = 0;
  while (i < t.length) {
    const c = t[i++];
    if (c === "M" || c === "L") cmds.push([c, +t[i++], +t[i++]]);
    else if (c === "C") cmds.push(["C", +t[i++], +t[i++], +t[i++], +t[i++], +t[i++], +t[i++]]);
    else if (c === "Z") cmds.push(["Z"]);
    else throw new Error("icon path: unsupported command " + c);
  }
  return { k: "p", d: cmds };
}
const C = (cx: number, cy: number, r: number): Part => ({ k: "c", cx, cy, r });
const R = (x: number, y: number, w: number, h: number, rx = 0): Part => ({ k: "r", x, y, w, h, rx });

export const ICONS: Record<string, Part[]> = {
  search: [C(11, 11, 7), P("M16.2 16.2 L20 20")],
  plus: [P("M12 5 L12 19"), P("M5 12 L19 12")],
  minus: [P("M5 12 L19 12")],
  check: [P("M5 12.5 L10 17.5 L19 7")],
  x: [P("M6 6 L18 18"), P("M18 6 L6 18")],
  "arrow-right": [P("M5 12 L19 12"), P("M13 6 L19 12 L13 18")],
  "chevron-down": [P("M6 9 L12 15 L18 9")],
  "chevron-right": [P("M9 6 L15 12 L9 18")],
  "chevron-left": [P("M15 6 L9 12 L15 18")],
  heart: [P("M12 20 C5 15.4 5 11 5 10 C5 7.8 6.8 6 9 6 C10.4 6 11.5 6.7 12 7.8 C12.5 6.7 13.6 6 15 6 C17.2 6 19 7.8 19 10 C19 11 19 15.4 12 20 Z")],
  cart: [C(9, 20, 1.4), C(18, 20, 1.4), P("M3 4 L5.5 4 L7.7 15 L18.3 15 L20.5 8 L6.2 8")],
  user: [C(12, 8, 4), P("M4 21 C5 17 8 15 12 15 C16 15 19 17 20 21")],
  bell: [P("M6 16 L6 11 C6 7.7 8.7 5 12 5 C15.3 5 18 7.7 18 11 L18 16 L20 18 L4 18 Z"), P("M10 21 L14 21")],
  home: [P("M4 11 L12 4 L20 11 L20 20 L4 20 Z"), P("M10 20 L10 14 L14 14 L14 20")],
  settings: [C(12, 12, 3), P("M12 3 L12 6"), P("M12 18 L12 21"), P("M3 12 L6 12"), P("M18 12 L21 12"), P("M5.6 5.6 L7.7 7.7"), P("M16.3 16.3 L18.4 18.4"), P("M18.4 5.6 L16.3 7.7"), P("M7.7 16.3 L5.6 18.4")],
  mail: [R(3, 5, 18, 14, 2), P("M3 7 L12 13 L21 7")],
  lock: [R(5, 11, 14, 9, 2), P("M8 11 L8 8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 L16 11")],
  eye: [P("M2 12 C5 7 8.5 5 12 5 C15.5 5 19 7 22 12 C19 17 15.5 19 12 19 C8.5 19 5 17 2 12 Z"), C(12, 12, 3)],
  "eye-off": [P("M2 12 C5 7 8.5 5 12 5 C15.5 5 19 7 22 12 C19 17 15.5 19 12 19 C8.5 19 5 17 2 12 Z"), C(12, 12, 3), P("M4 4 L20 20")],
  calendar: [R(3, 5, 18, 16, 2), P("M3 10 L21 10"), P("M8 3 L8 7"), P("M16 3 L16 7")],
  filter: [P("M4 5 L20 5 L14 13 L14 19 L10 17 L10 13 Z")],
  trash: [P("M4 7 L20 7"), P("M10 7 L10 4 L14 4 L14 7"), P("M6 7 L7 20 L17 20 L18 7")],
  download: [P("M12 4 L12 15"), P("M7 11 L12 16 L17 11"), P("M5 20 L19 20")],
  upload: [P("M12 16 L12 5"), P("M7 9 L12 4 L17 9"), P("M5 20 L19 20")],
  star: [P("M12 3 L14.7 8.6 L20.8 9.5 L16.4 13.8 L17.4 19.9 L12 17 L6.6 19.9 L7.6 13.8 L3.2 9.5 L9.3 8.6 Z")],
  menu: [P("M4 7 L20 7"), P("M4 12 L20 12"), P("M4 17 L20 17")],
  info: [C(12, 12, 9), P("M12 11 L12 16"), P("M12 8 L12 8.01")],
  alert: [P("M12 4 L21 20 L3 20 Z"), P("M12 10 L12 14"), P("M12 17 L12 17.01")],
  chart: [P("M5 20 L5 10"), P("M12 20 L12 4"), P("M19 20 L19 13")],
  file: [P("M6 3 L14 3 L18 7 L18 21 L6 21 Z"), P("M14 3 L14 7 L18 7")],
  more: [C(5, 12, 1.3), C(12, 12, 1.3), C(19, 12, 1.3)],
  card: [R(3, 6, 18, 13, 2), P("M3 10 L21 10")],
  tag: [P("M3 12 L12 3 L21 3 L21 12 L12 21 Z"), C(16.5, 7.5, 1.2)],
  image: [R(3, 4, 18, 16, 2), C(9, 10, 1.8), P("M3 17 L9 12 L14 16 L21 10")],
};

const attr = (p: Part): string => {
  if (p.k === "c") return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}"/>`;
  if (p.k === "r") return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"${p.rx ? ` rx="${p.rx}"` : ""}/>`;
  return `<path d="${pathData(p.d)}"/>`;
};

/** Inline SVG markup. Colored with currentColor so it follows the component's text color. */
export function icon(name: string, size = 18): string {
  const parts = ICONS[name]; if (!parts) throw new Error("unknown icon " + name);
  return `<svg class="ds-i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${parts.map(attr).join("")}</svg>`;
}

/** The same icon as vector shapes, drawn with its top-left at (x, y) at `size` px, stroked in `stroke`. */
export function iconShapes(name: string, x: number, y: number, size: number, stroke: string): Shape[] {
  const parts = ICONS[name]; if (!parts) return [];
  const k = size / 24, sw = 2 * k;
  return parts.map((p): Shape => {
    const paint = { fill: null, stroke, sw, cap: "round" as const, join: "round" as const };
    if (p.k === "c") return { t: "circle", cx: x + p.cx * k, cy: y + p.cy * k, r: p.r * k, ...paint };
    if (p.k === "r") return { t: "rect", x: x + p.x * k, y: y + p.y * k, w: p.w * k, h: p.h * k, rx: (p.rx ?? 0) * k, ...paint };
    return { t: "path", d: p.d.map((c): Cmd => c[0] === "Z" ? c : c[0] === "C" ? ["C", x + c[1] * k, y + c[2] * k, x + c[3] * k, y + c[4] * k, x + c[5] * k, y + c[6] * k] : [c[0], x + c[1] * k, y + c[2] * k]), ...paint };
  });
}
export const ICON_NAMES = Object.keys(ICONS);
