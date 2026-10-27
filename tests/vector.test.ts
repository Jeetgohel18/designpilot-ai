import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import * as opentype from "opentype.js";
import { circle, group, path as vpath, rect, text, toSvg, arc, flatten, type Vec } from "../lib/vector/ir";
import { outlineScene, outlineString, textWidth, wrapOpentype, estimateWidth, type GlyphFont } from "../lib/vector/text";
import { A4, PdfDoc, Sheet } from "../lib/pdf";

const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf";
const haveFont = existsSync(FONT);
const tmp = () => mkdtempSync(path.join(os.tmpdir(), "vec-"));
function loadFont(): GlyphFont { const b = readFileSync(FONT); return wrapOpentype(opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) as never); }

const scene = (): Vec => ({ w: 200, h: 100, bg: "#101014", title: "Test <logo> & \"quotes\"", shapes: [
  rect(10, 10, 80, 40, { fill: "#8b7cff", stroke: "#ffffff", sw: 2 }, 8), circle(150, 50, 30, { fill: "#55d6e8" }),
  group([vpath([["M", 0, 0], ...arc(0, 0, 20, 0, 270, false), ["Z"]], { fill: "#ffffff", fr: "evenodd" })], { tx: 100, ty: 80, rot: 15, sx: 0.5 }),
  text(100, 95, "Hi & <there>", 12, "Inter", "#ffffff", { anchor: "middle", weight: 700 }),
] });

describe("SVG output", () => {
  it("is well-formed XML with escaped text and the expected elements", () => {
    const svg = toSvg(scene()); const f = path.join(tmp(), "a.svg"); writeFileSync(f, svg);
    expect(() => execFileSync("xmllint", ["--noout", f])).not.toThrow();
    expect(svg).toContain("&lt;there&gt;"); expect(svg).toContain('fill-rule="evenodd"'); expect(svg).toContain('viewBox="0 0 200 100"'); expect(svg).toContain("<title>Test &lt;logo&gt;");
    expect(svg).not.toMatch(/NaN|undefined/);
  });
  it("rejects non-hex colors (no injection through fill attributes)", () => {
    const svg = toSvg({ w: 10, h: 10, shapes: [rect(0, 0, 5, 5, { fill: 'red" onload="x' })] });
    expect(svg).not.toContain("onload"); expect(svg).toContain('fill="none"');
  });
});

describe("outlined text", () => {
  it.skipIf(!haveFont)("produces real glyph paths whose width matches the font metrics", () => {
    const font = loadFont();
    const { d, width } = outlineString(font, "Logo", 0, 100, 100, 0);
    expect(d.length).toBeGreaterThan(20); expect(width).toBeGreaterThan(150);
    expect(textWidth(font, "Logo", 100)).toBeCloseTo(width, 5);
    expect(textWidth(font, "Logo", 100, 10)).toBeCloseTo(width + 30, 5);
    const { vec, missing } = outlineScene(scene(), () => font);
    expect(missing).toEqual([]); expect(JSON.stringify(vec.shapes)).not.toContain('"t":"text"');
  });
  it("leaves text live and reports the family when no font is available", () => {
    const { vec, missing } = outlineScene(scene(), () => undefined);
    expect(missing).toEqual(["Inter"]); expect(JSON.stringify(vec.shapes)).toContain('"t":"text"');
  });
  it("estimates widths without a font", () => { expect(estimateWidth("Hello", 10)).toBeGreaterThan(20); expect(estimateWidth("Hello", 10, true)).toBeGreaterThan(estimateWidth("Hello", 10)); });
  it("flatten bakes group transforms into absolute coordinates", () => {
    const flat = flatten([group([rect(0, 0, 10, 10, { fill: "#000000" })], { tx: 100, ty: 50 })]);
    expect(flat).toHaveLength(1); const p = flat[0]; if (p.t !== "path") throw new Error("expected path"); expect(p.d[0]).toEqual(["M", 100, 50]);
  });
});

describe("PDF writer", () => {
  function jpeg(): Uint8Array { const f = path.join(tmp(), "t.jpg"); execFileSync("python3", ["-I", "-c", `from PIL import Image; Image.new("RGB",(64,40),(139,124,255)).save(${JSON.stringify(f)},"JPEG",quality=90)`]); return readFileSync(f); }
  function build(): Uint8Array {
    const doc = new PdfDoc("Spec sheet — Button"); const sh = new Sheet(doc, "DesignPilot AI · test");
    sh.heading("Primary button"); sh.para("A button triggers an action. Use one primary per view — 15 “smart” quotes & (parentheses) \\ slash.");
    sh.h2("Tokens"); sh.table([["--color-primary", "#8B7CFF"], ["--radius-base", "8px"]], { mono: true });
    sh.swatches([{ label: "primary", hex: "#8b7cff" }, { label: "accent", hex: "#55d6e8" }]);
    sh.image(doc.addJpeg(jpeg(), 64, 40), 200, 120);
    const font = haveFont ? loadFont() : undefined; const v = font ? outlineScene(scene(), () => font).vec : scene();
    sh.vec(v, 240, 120, "#eeeeee");
    for (let i = 0; i < 70; i++) sh.bullets([`Guideline number ${i}: keep labels short and descriptive so people can scan them quickly.`]);
    return doc.build();
  }
  it("is a valid PDF with real extractable text, multiple pages, an image and correct metadata", () => {
    const f = path.join(tmp(), "s.pdf"); writeFileSync(f, build());
    const info = execFileSync("pdfinfo", [f]).toString();
    expect(info).toMatch(/Pages:\s+[2-9]/); expect(info).toContain("Spec sheet"); expect(info).toMatch(/Page size:\s+595\.28 x 841\.89/);
    const txt = execFileSync("pdftotext", ["-layout", f, "-"]).toString();
    expect(txt).toContain("Primary button"); expect(txt).toContain("--color-primary"); expect(txt).toContain("#8B7CFF"); expect(txt).toContain("Guideline number 69"); expect(txt).toContain("(parentheses)"); expect(txt).toContain("DesignPilot AI · test");
    const py = `import pypdf,sys; r=pypdf.PdfReader(sys.argv[1]); n=sum(len(p.images) for p in r.pages); print(len(r.pages), n)`;
    const [pages, images] = execFileSync("python3", ["-I", "-c", py, f]).toString().trim().split(" ").map(Number);
    expect(pages).toBeGreaterThan(1); expect(images).toBe(1);
    expect(() => execFileSync("pdftoppm", ["-r", "40", "-png", "-f", "1", "-l", "1", f, path.join(tmp(), "pg")])).not.toThrow();
  });
  it("renders vector artwork (not blank): page 1 contains the brand colors", () => {
    const dir = tmp(); const f = path.join(dir, "s.pdf"); writeFileSync(f, build());
    execFileSync("pdftoppm", ["-r", "80", "-png", "-f", "1", "-l", "1", f, path.join(dir, "pg")]);
    const py = `import sys,glob; from PIL import Image; im=Image.open(glob.glob(sys.argv[1]+"/pg*.png")[0]).convert("RGB"); px=im.getdata(); print(sum(1 for p in px if abs(p[0]-0x55)<12 and abs(p[1]-0xd6)<12 and abs(p[2]-0xe8)<12), sum(1 for p in px if abs(p[0]-0x8b)<12 and abs(p[1]-0x7c)<12 and abs(p[2]-0xff)<12))`;
    const [cyan, violet] = execFileSync("python3", ["-I", "-c", py, dir]).toString().trim().split(" ").map(Number);
    expect(cyan).toBeGreaterThan(50); expect(violet).toBeGreaterThan(50);
  });
  it("A4 constants", () => { expect(A4.w).toBeCloseTo(595.28, 2); });
});
