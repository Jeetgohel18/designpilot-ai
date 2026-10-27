import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultProfile, describe as describeConcept, generateConcepts, nameIdeas } from "../lib/brand/concepts";
import { ARCH, minSizes, renderLogo, NO_FONTS, type Fonts } from "../lib/brand/render";
import type { ArchetypeId, Layout, Scheme } from "../lib/brand/types";
import { toSvg } from "../lib/vector/ir";
import { wrapOpentype } from "../lib/vector/text";
import { makeProject } from "./fixtures";
import { parse } from "opentype.js";

const p = makeProject();
const d = p.directions[0];
const profile = defaultProfile(p);
const dir = mkdtempSync(join(tmpdir(), "brand-"));
const xml = (name: string, svg: string) => { const f = join(dir, name); writeFileSync(f, svg); execFileSync("xmllint", ["--noout", f]); };

describe("concept generation", () => {
  const concepts = generateConcepts(p, profile, d, 1);
  it("creates six concepts with distinct archetypes covering text, letter and symbol approaches", () => {
    expect(concepts).toHaveLength(6);
    expect(new Set(concepts.map((c) => c.archetype)).size).toBe(6);
    const ids = concepts.map((c) => c.archetype);
    expect(ids.some((i) => ["wordmark", "editorial"].includes(i))).toBe(true);
    expect(ids.some((i) => ["monogram", "letterform", "negative", "emblem"].includes(i))).toBe(true);
    expect(ids.some((i) => ["geometric", "combo", "minimal", "technical"].includes(i))).toBe(true);
  });
  it("beauty brief leans editorial/minimal rather than technical", () => {
    const ids = concepts.map((c) => c.archetype);
    expect(ids).toContain("editorial");
  });
  it("renders genuinely different artwork per concept", () => {
    const svgs = concepts.map((c) => toSvg(renderLogo(c, "primary", "full").vec));
    expect(new Set(svgs).size).toBe(6);
  });
  it("regenerating keeps pinned concepts and changes the rest", () => {
    const pinned = { ...concepts[0], pinned: true };
    const next = generateConcepts(p, profile, d, 2, [pinned, ...concepts.slice(1)]);
    expect(next[0].id).toBe(pinned.id);
    expect(next).toHaveLength(6);
    expect(new Set(next.map((c) => c.archetype)).size).toBe(6);
  });
  it("describes every concept without uniqueness or legal claims", () => {
    for (const c of concepts) {
      const a = describeConcept(c, profile);
      for (const v of [a.idea, a.meaning, a.shape, a.type, a.color, a.personality, a.bestUse, a.weakness]) expect(v.length).toBeGreaterThan(5);
      expect(JSON.stringify(a)).not.toMatch(/trademark(ed)?able|one of a kind|unique in the world|guarantee/i);
    }
  });
  it("name ideas are local words from the brief", () => {
    expect(nameIdeas(p).length).toBeGreaterThan(2);
  });
});

describe("every archetype × layout × scheme is a valid SVG", () => {
  const all = (Object.keys(ARCH) as ArchetypeId[]).map((a) => ({ ...generateConcepts(p, profile, d, 3)[0], archetype: a, id: a }));
  const layouts: Layout[] = ["primary", "horizontal", "stacked", "symbol", "wordmark"];
  const schemes: Scheme[] = ["full", "reversed", "black", "white"];
  it("renders and validates with xmllint (live text, no fonts loaded)", () => {
    for (const c of all) for (const l of layouts) for (const s of schemes) {
      const r = renderLogo(c, l, s, NO_FONTS);
      expect(r.vec.w).toBeGreaterThan(20); expect(r.vec.h).toBeGreaterThan(20);
      xml(`${c.archetype}-${l}-${s}.svg`, toSvg(r.vec));
    }
  });
  it("monochrome versions contain only one colour", () => {
    for (const c of all.filter((x) => x.archetype !== "negative")) for (const [s, col] of [["black", "#000000"], ["white", "#ffffff"]] as const) {
      const svg = toSvg(renderLogo(c, "primary", s).vec);
      const colours = new Set([...svg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,8})"/g)].map((m) => m[1].toLowerCase()));
      expect([...colours].every((x) => x === col), `${c.archetype} ${s}: ${[...colours]}`).toBe(true);
    }
  });
  it("min sizes are positive", () => { const m = minSizes(renderLogo(all[0], "primary", "full")); expect(m.digitalW).toBeGreaterThan(0); expect(m.printMm).toBeGreaterThanOrEqual(10); });
});

const FONT = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"].find(existsSync);
describe.skipIf(!FONT)("with real glyph outlines", () => {
  const buf = readFileSync(FONT!); const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const gf = wrapOpentype(parse(ab) as never);
  const fonts: Fonts = { glyph: () => gf };
  it("negative-space monogram is a true cut-out (even-odd path, no knock-out colour)", () => {
    const c = { ...generateConcepts(p, profile, d, 4)[0], archetype: "negative" as const };
    const svg = toSvg(renderLogo(c, "symbol", "full", fonts).vec);
    expect(svg).toContain('fill-rule="evenodd"'); expect(svg).not.toContain("<text");
    xml("neg.svg", svg);
    const black = toSvg(renderLogo(c, "symbol", "black", fonts).vec);
    expect([...black.matchAll(/(?:fill|stroke)="(#[0-9a-f]+)"/gi)].every((m) => m[1] === "#000000")).toBe(true);
  });
  it("renders a pixel check: transparent corners, ink in the middle", () => {
    const c = { ...generateConcepts(p, profile, d, 4)[0], archetype: "negative" as const };
    const svg = toSvg(renderLogo(c, "symbol", "black", fonts).vec);
    const f = join(dir, "px.svg"); writeFileSync(f, svg);
    try {
      execFileSync("rsvg-convert", ["-w", "200", "-o", join(dir, "px.png"), f]);
      const out = execFileSync("python3", ["-c", `from PIL import Image;im=Image.open("${join(dir, "px.png")}").convert("RGBA");w,h=im.size;print(im.getpixel((1,1))[3], im.getpixel((w//2,h//5))[3])`]).toString().trim();
      const [corner, mid] = out.split(" ").map(Number);
      expect(corner).toBe(0); expect(mid).toBeGreaterThan(200);
    } catch (e) { if ((e as { code?: string }).code === "ENOENT") return; throw e; }
  });
});

import { designBrief, brandSection } from "../lib/engine/handoff";
import { EXPORTS } from "../lib/engine/exports";
import { snapshotSchema } from "../lib/server/shareSchema";
import { makeZip } from "../lib/zip";

describe("integration with the rest of the project", () => {
  const concepts = generateConcepts(p, profile, d, 1);
  const withBrand = { ...p, brand: { profile, concepts, selected: concepts[0].id, seed: 1, updatedAt: 0 } };
  it("handoff brief only mentions brand once a logo is selected, and never claims uniqueness", () => {
    expect(brandSection(p)).toBe("");
    expect(designBrief(p)).not.toContain("Brand identity");
    const b = designBrief(withBrand);
    expect(b).toContain("Brand identity"); expect(b).toContain(concepts[0].palette.ink); expect(b).toMatch(/not checked against existing logos or trademarks/);
  });
  it("brand tokens export reflects the chosen concept", () => {
    const e = EXPORTS.find((x) => x.id === "brandtokens")!;
    expect(e.build(p)).toContain("No logo selected"); expect(e.build(p)).toContain("--color-primary");
    const css = e.build(withBrand);
    expect(css).toContain(`--font-logo: "${concepts[0].font.family}"`); expect(css).toContain(concepts[0].palette.ink);
  });
  it("share schema accepts a logo mood item and rejects tampered ones", () => {
    const snap = JSON.parse(JSON.stringify({ name: p.name, brief: p.brief, profile: p.profile, directions: p.directions, selectedDirection: null, moodboards: [{ id: "m", name: "b", directionId: d.id, updatedAt: 1, items: [{ id: "i", type: "logo", title: "Wordmark", concept: concepts[0] }] }] }));
    const ok = snapshotSchema.safeParse(snap); if (!ok.success) console.log(JSON.stringify(ok.error.issues.slice(0, 3)));
    expect(ok.success).toBe(true);
    snap.moodboards[0].items[0].concept.palette.ink = "javascript:alert(1)";
    expect(snapshotSchema.safeParse(snap).success).toBe(false);
    snap.moodboards[0].items[0].concept.palette.ink = "#112233"; snap.moodboards[0].items[0].concept.archetype = "<svg onload=x>";
    expect(snapshotSchema.safeParse(snap).success).toBe(false);
  });
  it("zip accepts binary content (PNG/PDF bytes) unchanged", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 255, 1, 2]);
    const dirz = mkdtempSync(join(tmpdir(), "zip-")); const f = join(dirz, "a.zip");
    writeFileSync(f, makeZip([{ name: "x/logo.png", content: bytes }, { name: "x/readme.txt", content: "héllo" }]));
    execFileSync("unzip", ["-tq", f]); execFileSync("unzip", ["-o", "-q", f, "-d", dirz]);
    expect([...readFileSync(join(dirz, "x/logo.png"))]).toEqual([...bytes]); expect(readFileSync(join(dirz, "x/readme.txt"), "utf8")).toBe("héllo");
  });
});

import { colorsMd, graphicStyleMd, guidelinesMd, imageDirectionMd, personalityMd, summaryMd, tokensCss, typographyMd } from "../lib/brand/kit";
describe("brand kit documents", () => {
  const c = generateConcepts(p, profile, d, 1)[0];
  it("every document renders from real project data without placeholders", () => {
    const docs = [colorsMd(c, d), typographyMd(c, d), personalityMd(profile), guidelinesMd(c, profile, NO_FONTS), graphicStyleMd(c, d), imageDirectionMd(c, d), summaryMd(c, profile), tokensCss(c, d)];
    for (const t of docs) { expect(t.length).toBeGreaterThan(40); expect(t).not.toMatch(/undefined|NaN|\[object/); }
    expect(docs[3]).toMatch(/Clear space/); expect(docs[3]).toMatch(/trademarks/);
    expect(docs[2]).toContain("Not set yet"); // differentiators left empty, not invented
  });
});
