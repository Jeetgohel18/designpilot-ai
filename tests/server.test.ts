import { describe, it, expect, beforeAll } from "vitest";
import os from "node:os";
import path from "node:path";
import { mkdtempSync } from "node:fs";
import { isPrivateIp } from "../lib/server/ssrf";
import { aiResultSchema, fromAi } from "../lib/engine/analyze";
import { snapshotSchema } from "../lib/server/shareSchema";
import { analyzeLocal } from "../lib/engine/analyze";
import { rateLimit } from "../lib/server/ratelimit";

beforeAll(() => { process.env.SHARE_DATA_DIR = mkdtempSync(path.join(os.tmpdir(), "dp-")); });

const brief = "A premium skincare e-commerce website for Gen Z";
function snapshot() {
  const a = analyzeLocal(brief);
  return snapshotSchema.parse({ name: "Test", brief, profile: a.profile, directions: a.directions, selectedDirection: null, moodboards: [] });
}

describe("share store", () => {
  it("creates, reads, authorizes, disables and deletes", async () => {
    const { createShare, readShare, updateShare, deleteShare } = await import("../lib/server/shares");
    const { token, ownerKey } = await createShare("project", snapshot());
    expect((await readShare(token))?.snapshot.name).toBe("Test");
    expect(await updateShare(token, "wrong-key-wrong-key", { enabled: false })).toEqual({ ok: false, status: 403 });
    expect(await readShare(token)).not.toBeNull();
    expect(await updateShare(token, ownerKey, { enabled: false })).toEqual({ ok: true, enabled: false });
    expect(await readShare(token)).toBeNull();
    expect(await updateShare(token, ownerKey, { enabled: true })).toEqual({ ok: true, enabled: true });
    expect(await readShare("nope-nope-nope")).toBeNull();
    expect(await deleteShare(token, "wrong-key-wrong-key")).toEqual({ ok: false, status: 403 });
    expect(await deleteShare(token, ownerKey)).toEqual({ ok: true, enabled: false });
    expect(await readShare(token)).toBeNull();
  });
  it("handles concurrent creates without losing rows", async () => {
    const { createShare, readShare } = await import("../lib/server/shares");
    const made = await Promise.all(Array.from({ length: 15 }, () => createShare("project", snapshot())));
    for (const m of made) expect(await readShare(m.token)).not.toBeNull();
  });
  it("rejects malformed snapshots", () => {
    expect(snapshotSchema.safeParse({ name: "x" }).success).toBe(false);
  });
});

describe("ssrf", () => {
  it("flags private addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.5", "172.20.0.1", "169.254.169.254", "::1", "fd00::1"]) expect(isPrivateIp(ip)).toBe(true);
    for (const ip of ["8.8.8.8", "1.1.1.1"]) expect(isPrivateIp(ip)).toBe(false);
  });
});

describe("AI output handling", () => {
  const a = analyzeLocal(brief);
  const ai = {
    profile: a.profile,
    directions: a.directions.map((d) => ({ name: d.name, summary: d.summary, harmony: d.palette.harmony, paletteName: d.palette.name, paletteReasoning: d.palette.mood, colors: d.palette.colors, headingFont: d.fonts.heading, bodyFont: d.fonts.body, fontRationale: d.fontRationale, imageStyle: d.imageStyle, illustrationStyle: d.illustrationStyle, iconStyle: d.iconStyle, logoDirection: d.logoDirection, uiInspiration: d.uiInspiration, principles: d.principles, components: d.components, brandReferences: d.brandReferences })),
  };
  it("accepts a valid model response", () => { expect(fromAi(aiResultSchema.parse(ai)).directions).toHaveLength(3); });
  it("rejects bad colors and wrong direction count", () => {
    expect(aiResultSchema.safeParse({ ...ai, directions: ai.directions.slice(0, 2) }).success).toBe(false);
    const bad = structuredClone(ai); bad.directions[0].colors.primary = "red";
    expect(aiResultSchema.safeParse(bad).success).toBe(false);
  });
});

describe("rate limit", () => {
  it("blocks after max", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "9.9.9.9" } });
    const r = Array.from({ length: 4 }, () => rateLimit(req, "t", 3).ok);
    expect(r).toEqual([true, true, true, false]);
  });
});
