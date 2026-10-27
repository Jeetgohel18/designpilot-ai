"use client";
import { toCanvas } from "html-to-image";
import { esc } from "./vector/ir";

export type RasterFormat = "png" | "jpeg";
export interface RasterOptions { format: RasterFormat; scale: number; background: string | null; quality?: number }

const MAX_SIDE = 8192;

export function canvasToBlob(c: HTMLCanvasElement, format: RasterFormat, quality = 0.92): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("The browser couldn't encode the image"))), format === "png" ? "image/png" : "image/jpeg", quality));
}

/** True when a canvas has no visible content (fully transparent, or one flat color). Used so we never save a blank export. */
export function isBlank(c: HTMLCanvasElement): boolean {
  const ctx = c.getContext("2d"); if (!ctx || !c.width || !c.height) return true;
  const stepX = Math.max(1, Math.floor(c.width / 64)), stepY = Math.max(1, Math.floor(c.height / 64));
  let first: string | null = null;
  for (let y = 0; y < c.height; y += stepY) for (let x = 0; x < c.width; x += stepX) {
    const d = ctx.getImageData(x, y, 1, 1).data; const key = `${d[0]},${d[1]},${d[2]},${d[3]}`;
    if (first === null) first = key; else if (key !== first) return false;
  }
  return true;
}

function flatten(c: HTMLCanvasElement, bg: string | null): HTMLCanvasElement {
  if (!bg) return c;
  const out = document.createElement("canvas"); out.width = c.width; out.height = c.height;
  const ctx = out.getContext("2d")!; ctx.fillStyle = bg; ctx.fillRect(0, 0, out.width, out.height); ctx.drawImage(c, 0, 0);
  return out;
}

// ---- web-font embedding (so exports keep the real typefaces)
const fontCssCache = new Map<string, string>();
const b64 = (buf: ArrayBuffer) => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

/** CSS with the Latin subset of each family embedded as data: URLs. Returns `ok:false` if any family couldn't be fetched. */
export async function fontEmbedCss(families: string[], weights = [400, 500, 600, 700]): Promise<{ css: string; ok: boolean; failed: string[] }> {
  const failed: string[] = []; let css = "";
  for (const fam of [...new Set(families.filter(Boolean))]) {
    const key = `${fam}|${weights.join(",")}`;
    if (!fontCssCache.has(key)) {
      try {
        const res = await fetch(`https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, "+")}:wght@${weights.join(";")}&display=swap`);
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        let out = "";
        for (const m of text.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)) {
          if (m[1] !== "latin") continue; // keep exports small: Latin subset only
          const url = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(m[2])?.[1]; if (!url) continue;
          const bin = await fetch(url); if (!bin.ok) throw new Error("font file");
          out += m[2].replace(/url\([^)]+\)\s*format\([^)]+\)/, `url(data:font/woff2;base64,${b64(await bin.arrayBuffer())}) format('woff2')`) + "\n";
        }
        if (!out) throw new Error("no latin subset");
        fontCssCache.set(key, out);
      } catch { failed.push(fam); fontCssCache.set(key, ""); }
    }
    const got = fontCssCache.get(key)!; if (!got && !failed.includes(fam)) failed.push(fam); css += got;
  }
  return { css, ok: failed.length === 0, failed };
}

/** Render a live DOM element to PNG/JPEG. Fonts are embedded; the result is checked so a blank image is never saved. */
export async function elementToBlob(el: HTMLElement, o: RasterOptions & { fontFamilies?: string[] }): Promise<{ blob: Blob; width: number; height: number; fontsEmbedded: boolean; failedFonts: string[] }> {
  const w = Math.ceil(el.scrollWidth || el.offsetWidth), h = Math.ceil(el.scrollHeight || el.offsetHeight);
  if (!w || !h) throw new Error("Nothing to render — the preview has no size");
  const ratio = Math.min(o.scale, MAX_SIDE / Math.max(w, h));
  const fonts = o.fontFamilies?.length ? await fontEmbedCss(o.fontFamilies) : { css: "", ok: true, failed: [] as string[] };
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = await toCanvas(el, { pixelRatio: ratio, width: w, height: h, fontEmbedCSS: fonts.css, cacheBust: true, skipAutoScale: true, style: { background: o.background ?? "transparent", margin: "0", transform: "none" } });
  if (isBlank(canvas)) throw new Error("The render came out blank, so nothing was saved. Try again, or use SVG / code export.");
  const out = o.format === "jpeg" ? flatten(canvas, o.background ?? "#ffffff") : canvas;
  return { blob: await canvasToBlob(out, o.format, o.quality), width: out.width, height: out.height, fontsEmbedded: fonts.ok, failedFonts: fonts.failed };
}

/** Rasterize standalone SVG markup (logos etc.). Text must already be outlined, or fonts embedded via `fontCss`. */
export async function svgToBlob(svg: string, w: number, h: number, o: RasterOptions & { fontCss?: string }): Promise<{ blob: Blob; width: number; height: number }> {
  const withFonts = o.fontCss ? svg.replace(/(<svg[^>]*>)/, `$1<defs><style>${esc(o.fontCss).replace(/&quot;/g, '"').replace(/&gt;/g, ">")}</style></defs>`) : svg;
  const ratio = Math.min(o.scale, MAX_SIDE / Math.max(w, h));
  const url = URL.createObjectURL(new Blob([withFonts], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image(); img.decoding = "sync";
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("The SVG couldn't be rendered")); img.src = url; });
    const c = document.createElement("canvas"); c.width = Math.round(w * ratio); c.height = Math.round(h * ratio);
    const ctx = c.getContext("2d")!; ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, 0, 0, c.width, c.height);
    if (isBlank(c)) throw new Error("The render came out blank, so nothing was saved.");
    const out = o.format === "jpeg" ? flatten(c, o.background ?? "#ffffff") : o.background ? flatten(c, o.background) : c;
    return { blob: await canvasToBlob(out, o.format, o.quality), width: out.width, height: out.height };
  } finally { URL.revokeObjectURL(url); }
}

/** JPEG bytes of a blob (for embedding in PDFs). */
export async function blobBytes(b: Blob): Promise<Uint8Array> { return new Uint8Array(await b.arrayBuffer()); }
