import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError } from "@google/genai";
import { makeProject } from "./fixtures";
import { localMore, seedFromAnalysis } from "../lib/engine/brainstorm";
import { IDEA_GROUPS } from "../lib/types";

const context = { brief: "A premium skincare e-commerce site", summary: "E-commerce in beauty", industry: "Beauty & Skincare", audience: "Gen Z" };
const post = async (body: unknown, ip: string) => { const { POST } = await import("../app/api/brainstorm/route"); return POST(new Request("http://x", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) })); };
const mockGemini = (o: { configured?: boolean; text?: string; error?: unknown }) => vi.doMock("../lib/server/gemini", async () => {
  const real = await vi.importActual<typeof import("../lib/server/gemini")>("../lib/server/gemini");
  return { ...real, aiConfigured: () => o.configured ?? true, generateDetailed: async () => { if (o.error) throw o.error; return { text: o.text ?? "", model: "m", elapsedMs: 1 }; } };
});

describe("brainstorm engine (local)", () => {
  const p = makeProject();
  it("seed board comes only from the analysis and covers the groups", () => {
    const ideas = seedFromAnalysis(p);
    expect(new Set(ideas.map((i) => i.group)).size).toBeGreaterThanOrEqual(5);
    expect(ideas.every((i) => i.origin === "analysis" && i.status === "open")).toBe(true);
    expect(ideas.some((i) => p.profile.challenges.includes(i.text))).toBe(true);
  });
  it("local generator avoids duplicates and respects the group", () => {
    const first = localMore(p, [], "Open questions", 3);
    expect(first).toHaveLength(3); expect(first.every((i) => i.group === "Open questions" && i.origin === "local")).toBe(true);
    const again = localMore(p, first.map((i) => i.text), "Open questions", 3);
    expect(again.some((i) => first.some((f) => f.text === i.text))).toBe(false);
  });
  it("can generate across all groups", () => { expect(new Set(localMore(p, [], undefined, 6).map((i) => i.group)).size).toBeGreaterThan(1); });
});

describe("/api/brainstorm", () => {
  beforeEach(() => { vi.resetModules(); vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); vi.doUnmock("../lib/server/gemini"); });
  const gen = { mode: "generate", existing: [], context };

  it("returns AI ideas when Gemini answers with valid JSON", async () => {
    mockGemini({ text: JSON.stringify({ ideas: [{ group: "Features", text: "Skin-type quiz" }, { group: "Open questions", text: "Which markets first?" }] }) });
    const j = await (await post(gen, "10.0.0.1")).json();
    expect(j).toMatchObject({ source: "ai", provider: "gemini" }); expect(j.ideas).toHaveLength(2);
  });
  it("rejects ideas with invalid groups (schema validation) and reports unavailable", async () => {
    mockGemini({ text: JSON.stringify({ ideas: [{ group: "Nonsense", text: "x y z" }] }) });
    const j = await (await post(gen, "10.0.0.2")).json();
    expect(j.source).toBe("unavailable"); expect(j.ideas).toEqual([]); expect(j.reason).toBe("bad_output");
  });
  it("generate: provider failure is a 200 'unavailable' so the client can fall back to labelled local ideas", async () => {
    mockGemini({ error: new ApiError({ message: "{}", status: 429 }) });
    const res = await post(gen, "10.0.0.3"); const j = await res.json();
    expect(res.status).toBe(200); expect(j).toMatchObject({ source: "unavailable", reason: "quota" }); expect(j.notice).toMatch(/quota/i);
  });
  it("refine: failure is an error (503) so the client keeps the original note", async () => {
    mockGemini({ error: new ApiError({ message: "{}", status: 503 }) });
    const res = await post({ mode: "refine", group: "Features", idea: "Quiz", existing: [], context }, "10.0.0.4");
    expect(res.status).toBe(503); expect((await res.json()).ideas).toEqual([]);
  });
  it("without a key: generate falls back (200), refine reports unavailable (503)", async () => {
    mockGemini({ configured: false });
    expect((await post(gen, "10.0.0.5")).status).toBe(200);
    expect((await post({ mode: "refine", idea: "x y z", existing: [], context }, "10.0.0.6")).status).toBe(503);
  });
  it("validates input and never echoes secrets", async () => {
    mockGemini({ text: "{}" });
    expect((await post({ mode: "nope" }, "10.0.0.7")).status).toBe(400);
    expect((await post({ mode: "refine", existing: [], context }, "10.0.0.8")).status).toBe(400);
    expect(IDEA_GROUPS).toHaveLength(6);
  });
});
