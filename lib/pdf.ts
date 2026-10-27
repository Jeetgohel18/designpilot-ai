// Dependency-free PDF 1.4 writer. Real selectable text (standard Helvetica/Courier, WinAnsi), vector shapes from the shared
// IR, and embedded JPEG images. Coordinates in this API are points with the origin at the TOP-LEFT of the page.
import { flatten, color, type Cmd, type Vec } from "./vector/ir";
import { helvWidth } from "./vector/text";

export const A4 = { w: 595.28, h: 841.89 };
export type PdfFont = "F1" | "F2" | "F3"; // Helvetica, Helvetica-Bold, Courier
const FONT_NAMES: Record<PdfFont, string> = { F1: "Helvetica", F2: "Helvetica-Bold", F3: "Courier" };

const WIN: Record<string, number> = { "—": 0x97, "–": 0x96, "·": 0xb7, "…": 0x85, "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94, "•": 0x95, "×": 0xd7, "é": 0xe9, "è": 0xe8, "á": 0xe1, "ü": 0xfc, "ö": 0xf6, "ä": 0xe4, "ñ": 0xf1, "ç": 0xe7, "→": 0x3e, "✓": 0x2a, "©": 0xa9, "®": 0xae, "°": 0xb0 };
function encode(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    const b = c >= 32 && c <= 126 ? c : WIN[ch] ?? (c >= 0xa0 && c <= 0xff ? c : 0x3f);
    if (b === 0x28 || b === 0x29 || b === 0x5c) out += "\\" + String.fromCharCode(b);
    else if (b >= 32 && b <= 126) out += String.fromCharCode(b);
    else out += "\\" + b.toString(8).padStart(3, "0");
  }
  return out;
}
const f = (v: number) => (Math.round(v * 100) / 100).toString();
function rgb(hex: string | null | undefined, fallback = "#000000"): string {
  const h = (color(hex) ?? fallback).replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => f(parseInt(full.slice(i, i + 2), 16) / 255)).join(" ");
}
export const textW = (s: string, size: number, font: PdfFont = "F1") => (font === "F3" ? s.length * 0.6 * size : helvWidth(s, size, font === "F2"));

export interface PdfImage { id: number; w: number; h: number; jpeg: Uint8Array }

export class PdfPage {
  ops: string[] = []; imgIds = new Set<number>();
  constructor(public W = A4.w, public H = A4.h) {}
  private Y = (y: number) => this.H - y;
  rect(x: number, y: number, w: number, h: number, o: { fill?: string | null; stroke?: string | null; lw?: number } = {}) {
    const parts = [`q`]; if (o.fill) parts.push(`${rgb(o.fill)} rg`); if (o.stroke) parts.push(`${rgb(o.stroke)} RG ${f(o.lw ?? 0.75)} w`);
    parts.push(`${f(x)} ${f(this.Y(y + h))} ${f(w)} ${f(h)} re`, o.fill && o.stroke ? "B" : o.fill ? "f" : "S", "Q"); this.ops.push(parts.join("\n"));
  }
  line(x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; lw?: number } = {}) {
    this.ops.push(`q ${rgb(o.stroke ?? "#cccccc")} RG ${f(o.lw ?? 0.75)} w ${f(x1)} ${f(this.Y(y1))} m ${f(x2)} ${f(this.Y(y2))} l S Q`);
  }
  /** `y` is the text baseline. */
  text(s: string, x: number, y: number, o: { size?: number; font?: PdfFont; color?: string } = {}) {
    this.ops.push(`BT ${rgb(o.color)} rg /${o.font ?? "F1"} ${f(o.size ?? 11)} Tf ${f(x)} ${f(this.Y(y))} Td (${encode(s)}) Tj ET`);
  }
  /** Draw a (text-free) vector scene with its top-left at (x, y), scaled by `scale`. Live text must be outlined first. */
  vec(v: Vec, x: number, y: number, scale = 1) {
    const out: string[] = [`q ${f(scale)} 0 0 ${f(-scale)} ${f(x)} ${f(this.Y(y))} cm`];
    if (color(v.bg)) out.push(`${rgb(v.bg)} rg 0 0 ${f(v.w)} ${f(v.h)} re f`);
    for (const s of flatten(v.shapes)) {
      if (s.t !== "path") continue; // text must have been outlined; skipped otherwise
      const fill = color(s.fill), stroke = color(s.stroke);
      if (!fill && !stroke) continue;
      if (fill) out.push(`${rgb(fill)} rg`);
      if (stroke) out.push(`${rgb(stroke)} RG ${f(s.sw ?? 1)} w ${s.cap === "round" ? 1 : s.cap === "square" ? 2 : 0} J ${s.join === "round" ? 1 : s.join === "bevel" ? 2 : 0} j`);
      out.push(pathOps(s.d), fill && stroke ? (s.fr ? "B*" : "B") : fill ? (s.fr ? "f*" : "f") : "S");
    }
    out.push("Q"); this.ops.push(out.join("\n"));
  }
  image(img: PdfImage, x: number, y: number, w: number, h: number) {
    this.imgIds.add(img.id);
    this.ops.push(`q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(this.Y(y + h))} cm /Im${img.id} Do Q`);
  }
}

function pathOps(d: Cmd[]): string {
  return d.map((c) => c[0] === "M" ? `${f(c[1])} ${f(c[2])} m` : c[0] === "L" ? `${f(c[1])} ${f(c[2])} l` : c[0] === "C" ? `${f(c[1])} ${f(c[2])} ${f(c[3])} ${f(c[4])} ${f(c[5])} ${f(c[6])} c` : "h").join("\n");
}

export class PdfDoc {
  pages: PdfPage[] = []; images: PdfImage[] = [];
  constructor(public title = "Document", public author = "DesignPilot AI") {}
  addPage(w = A4.w, h = A4.h) { const p = new PdfPage(w, h); this.pages.push(p); return p; }
  addJpeg(jpeg: Uint8Array, w: number, h: number): PdfImage { const img = { id: this.images.length + 1, w, h, jpeg }; this.images.push(img); return img; }

  build(): Uint8Array {
    const enc = new TextEncoder();
    const chunks: Uint8Array[] = []; const offsets: number[] = []; let pos = 0;
    const push = (b: Uint8Array | string) => { const u = typeof b === "string" ? enc.encode(b) : b; chunks.push(u); pos += u.length; };
    const obj = (id: number, body: string | (() => void)) => { offsets[id] = pos; push(`${id} 0 obj\n`); if (typeof body === "string") push(body); else body(); push("\nendobj\n"); };

    // ids: 1 catalog, 2 pages, 3-5 fonts, 6 info, then images, then per page (page, content)
    const imgBase = 7, pageBase = imgBase + this.images.length;
    push("%PDF-1.4\n%âãÏÓ\n");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, `<< /Type /Pages /Count ${this.pages.length} /Kids [${this.pages.map((_, i) => `${pageBase + i * 2} 0 R`).join(" ")}] >>`);
    (["F1", "F2", "F3"] as PdfFont[]).forEach((k, i) => obj(3 + i, `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_NAMES[k]} /Encoding /WinAnsiEncoding >>`));
    const date = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    obj(6, `<< /Title (${encode(this.title)}) /Producer (DesignPilot AI) /Author (${encode(this.author)}) /CreationDate (D:${date}Z) >>`);
    this.images.forEach((img, i) => obj(imgBase + i, () => { push(`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`); push(img.jpeg); push("\nendstream"); }));
    this.pages.forEach((p, i) => {
      const pid = pageBase + i * 2, cid = pid + 1;
      const xo = [...p.imgIds].map((id) => `/Im${id} ${imgBase + id - 1} 0 R`).join(" ");
      obj(pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(p.W)} ${f(p.H)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >>${xo ? ` /XObject << ${xo} >>` : ""} >> /Contents ${cid} 0 R >>`);
      const content = p.ops.join("\n"); obj(cid, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    });
    const total = pageBase + this.pages.length * 2;
    const xref = pos;
    push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let i = 1; i < total; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
    push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(pos); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }
}

/** Simple top-to-bottom layout on A4 pages with automatic wrapping and page breaks. */
export class Sheet {
  page: PdfPage; y: number; readonly m = 48;
  constructor(public doc: PdfDoc, private footer = "") { this.page = doc.addPage(); this.y = this.m; this.decorate(); }
  private get bottom() { return this.page.H - this.m - 14; }
  get width() { return this.page.W - this.m * 2; }
  private decorate() { if (this.footer) this.page.text(this.footer, this.m, this.page.H - 28, { size: 8, color: "#888888" }); }
  newPage() { this.page = this.doc.addPage(); this.y = this.m; this.decorate(); }
  ensure(h: number) { if (this.y + h > this.bottom) this.newPage(); }
  space(h: number) { this.y += h; }
  heading(s: string, size = 20) { this.ensure(size * 2); this.y += size; this.page.text(s, this.m, this.y, { size, font: "F2" }); this.y += size * 0.5; }
  h2(s: string) { this.ensure(34); this.y += 18; this.page.text(s, this.m, this.y, { size: 13, font: "F2" }); this.y += 6; this.page.line(this.m, this.y, this.m + this.width, this.y, { stroke: "#dddddd" }); this.y += 8; }
  wrap(s: string, size: number, font: PdfFont, maxW: number): string[] {
    const lines: string[] = [];
    for (const para of s.split("\n")) {
      let cur = "";
      for (const word of para.split(/\s+/)) {
        const next = cur ? `${cur} ${word}` : word;
        if (textW(next, size, font) > maxW && cur) { lines.push(cur); cur = word; } else cur = next;
      }
      lines.push(cur);
    }
    return lines;
  }
  para(s: string, o: { size?: number; font?: PdfFont; color?: string; indent?: number } = {}) {
    const size = o.size ?? 10.5, lh = size * 1.45, ind = o.indent ?? 0;
    for (const ln of this.wrap(s, size, o.font ?? "F1", this.width - ind)) { this.ensure(lh); this.y += lh; this.page.text(ln, this.m + ind, this.y, { size, font: o.font, color: o.color }); }
    this.y += 3;
  }
  bullets(items: string[], size = 10.5) {
    for (const it of items) {
      const lines = this.wrap(it, size, "F1", this.width - 14); const lh = size * 1.45;
      lines.forEach((ln, i) => { this.ensure(lh); this.y += lh; if (i === 0) this.page.text("•", this.m + 2, this.y, { size }); this.page.text(ln, this.m + 14, this.y, { size }); });
    }
    this.y += 3;
  }
  table(rows: [string, string][], o: { keyW?: number; size?: number; mono?: boolean } = {}) {
    const size = o.size ?? 9.5, kw = o.keyW ?? 150, lh = size * 1.5;
    for (const [k, v] of rows) {
      const lines = this.wrap(v, size, o.mono ? "F3" : "F1", this.width - kw - 8); this.ensure(lh * lines.length + 2);
      const top = this.y; this.y += lh;
      this.page.text(k, this.m, this.y, { size, font: "F2", color: "#444444" });
      lines.forEach((ln, i) => { if (i) { this.y += lh; } this.page.text(ln, this.m + kw, this.y, { size, font: o.mono ? "F3" : "F1" }); });
      this.page.line(this.m, this.y + 4, this.m + this.width, this.y + 4, { stroke: "#eeeeee" }); this.y += 5; void top;
    }
  }
  swatches(items: { label: string; hex: string }[], size = 44) {
    const per = Math.max(1, Math.floor(this.width / (size + 14))); const rows = Math.ceil(items.length / per);
    this.ensure(rows * (size + 30)); this.y += 4;
    items.forEach((it, i) => {
      const col = i % per, r = Math.floor(i / per), x = this.m + col * (size + 14), y = this.y + r * (size + 30);
      this.page.rect(x, y, size, size, { fill: it.hex, stroke: "#cccccc", lw: 0.5 });
      this.page.text(it.label, x, y + size + 11, { size: 7.5, font: "F2" }); this.page.text(it.hex.toUpperCase(), x, y + size + 21, { size: 7.5, color: "#666666", font: "F3" });
    });
    this.y += rows * (size + 30);
  }
  image(img: PdfImage, maxW = this.width, maxH = 300) {
    const s = Math.min(maxW / img.w, maxH / img.h), w = img.w * s, h = img.h * s;
    this.ensure(h + 8); this.y += 4; this.page.image(img, this.m, this.y, w, h); this.y += h + 4;
  }
  vec(v: Vec, maxW = this.width, maxH = 220, bgBox?: string) {
    const s = Math.min(maxW / v.w, maxH / v.h), w = v.w * s, h = v.h * s;
    this.ensure(h + 8); this.y += 4;
    if (bgBox) this.page.rect(this.m, this.y, w, h, { fill: bgBox });
    this.page.vec(v, this.m, this.y, s); this.y += h + 4;
  }
}
