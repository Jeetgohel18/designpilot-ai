// Runs the REAL @google/genai SDK against a local fake Gemini server to prove retry/timeout behaviour.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

type Hit = { model: string; body: { generationConfig?: { thinkingConfig?: unknown; maxOutputTokens?: number }; tools?: unknown } };
let server: http.Server;
let hits: Hit[] = [];
let handler: (model: string, hit: Hit, res: http.ServerResponse) => void = () => {};
const OK = (text: string) => JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }] });
const err = (res: http.ServerResponse, code: number, status: string, message: string) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify({ error: { code, status, message } })); };

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = ""; req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const model = /models\/([^:]+):generateContent/.exec(req.url ?? "")?.[1] ?? "?";
      const hit = { model, body: raw ? JSON.parse(raw) : {} };
      hits.push(hit); handler(model, hit, res);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  process.env.GOOGLE_GEMINI_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.GEMINI_API_KEY = "local-test-key-123456";
});
afterAll(() => { server.closeAllConnections?.(); server.close(); });
beforeEach(() => { hits = []; vi.resetModules(); delete process.env.GEMINI_MODEL; });

const load = () => import("../lib/server/gemini");
const small = { system: "s", prompt: "Say: ready", maxTokens: 32, totalMs: 6_000 } as const;

describe("real SDK vs fake Gemini", () => {
  it("success: one request, minimal prompt, no tools, small output, minimal thinking", async () => {
    handler = (_m, _h, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end(OK("ready")); };
    const { generateDetailed } = await load();
    const r = await generateDetailed({ ...small, thinking: "minimal" });
    expect(r).toMatchObject({ text: "ready", model: "gemini-3.5-flash-lite" });
    expect(hits).toHaveLength(1);
    expect(hits[0].body.tools).toBeUndefined();
    expect(hits[0].body.generationConfig?.maxOutputTokens).toBe(32);
    expect(JSON.stringify(hits[0].body.generationConfig?.thinkingConfig)).toMatch(/minimal/i);
  });

  it("503 is not retried and is reported as a provider failure immediately", async () => {
    handler = (_m, _h, res) => err(res, 503, "UNAVAILABLE", "overloaded");
    const { generateDetailed } = await load();
    const t0 = Date.now();
    await expect(generateDetailed(small)).rejects.toMatchObject({ kind: "provider", status: 503 });
    expect(hits).toHaveLength(1);              // exactly one request: no hidden retries
    expect(Date.now() - t0).toBeLessThan(2_000);
  });

  it("429 free-tier limit is reported as quota (not disguised as a timeout) after exactly one request", async () => {
    handler = (_m, _h, res) => err(res, 429, "RESOURCE_EXHAUSTED", "quota");
    const { generateDetailed } = await load();
    const t0 = Date.now();
    await expect(generateDetailed(small)).rejects.toMatchObject({ kind: "quota", status: 429 });
    expect(hits).toHaveLength(1); expect(Date.now() - t0).toBeLessThan(2_000);
  });

  it("a hanging server times out inside the total budget with a single attempt", async () => {
    handler = () => { /* never answer */ };
    const { generateDetailed } = await load();
    const t0 = Date.now();
    await expect(generateDetailed({ ...small, totalMs: 4_500 })).rejects.toMatchObject({ kind: "timeout", model: "gemini-3.5-flash-lite" });
    const took = Date.now() - t0;
    expect(took).toBeGreaterThanOrEqual(4_000); expect(took).toBeLessThan(6_500);
    expect(hits).toHaveLength(1);
  }, 15_000);

  it("404 on the first model moves to the second; total hits stay bounded", async () => {
    handler = (m, _h, res) => { if (m === "gemini-3.5-flash-lite") return err(res, 404, "NOT_FOUND", "gone"); res.writeHead(200, { "content-type": "application/json" }); res.end(OK("ready")); };
    const { generateDetailed } = await load();
    const r = await generateDetailed(small);
    expect(r.model).toBe("gemini-3.1-flash-lite"); expect(hits.map((h) => h.model)).toEqual(["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });

  it("a model that rejects the thinking setting is retried ONCE without it", async () => {
    handler = (_m, h, res) => { if (h.body.generationConfig?.thinkingConfig) return err(res, 400, "INVALID_ARGUMENT", "Thinking level is not supported for this model"); res.writeHead(200, { "content-type": "application/json" }); res.end(OK("ready")); };
    const { generateDetailed } = await load();
    const r = await generateDetailed(small);
    expect(r.text).toBe("ready"); expect(hits).toHaveLength(2); expect(hits[1].body.generationConfig?.thinkingConfig).toBeUndefined();
  });

  it("other 400s are not retried", async () => {
    handler = (_m, _h, res) => err(res, 400, "INVALID_ARGUMENT", "bad contents");
    const { generateDetailed } = await load();
    await expect(generateDetailed(small)).rejects.toMatchObject({ kind: "invalid_request" });
    expect(hits).toHaveLength(1);
  });

  it("GEMINI_MODEL is honoured exclusively", async () => {
    process.env.GEMINI_MODEL = "my-model";
    handler = (_m, _h, res) => err(res, 404, "NOT_FOUND", "nf");
    const { generateDetailed } = await load();
    await expect(generateDetailed(small)).rejects.toMatchObject({ kind: "model_not_found" });
    expect(hits.map((h) => h.model)).toEqual(["my-model"]);
  });

  it("full analysis pipeline over the real SDK: valid JSON -> ai result; schema-invalid -> bad_output", async () => {
    const { analyzeLocal } = await import("../lib/engine/analyze");
    const a = analyzeLocal("A premium skincare e-commerce website for Gen Z");
    const good = JSON.stringify({ profile: a.profile, directions: a.directions.map((d) => ({ name: d.name, summary: d.summary, harmony: d.palette.harmony, paletteName: d.palette.name, paletteReasoning: d.palette.mood, colors: d.palette.colors, headingFont: d.fonts.heading, bodyFont: d.fonts.body, fontRationale: d.fontRationale, imageStyle: d.imageStyle, illustrationStyle: d.illustrationStyle, iconStyle: d.iconStyle, logoDirection: d.logoDirection, uiInspiration: d.uiInspiration, principles: d.principles, components: d.components, brandReferences: d.brandReferences })) });
    handler = (_m, _h, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end(OK(good)); };
    const { runAiAnalysis } = await import("../lib/server/analysis");
    const r = await runAiAnalysis("A premium skincare e-commerce website for Gen Z", {});
    expect(r.directions).toHaveLength(3); expect(r.model).toBe("gemini-3.5-flash-lite");
    vi.resetModules();
    handler = (_m, _h, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end(OK('{"profile":{}}')); };
    const again = await import("../lib/server/analysis");
    await expect(again.runAiAnalysis("A premium skincare e-commerce website for Gen Z", {})).rejects.toMatchObject({ kind: "bad_output" });
  });

  it("/api/analyze end to end over the real SDK, and /api/ai-status?test=analyze (developer only)", async () => {
    process.env.AI_STATUS_TOKEN = "dev-token-dev-token-1234";
    const { analyzeLocal } = await import("../lib/engine/analyze");
    const a = analyzeLocal("A premium skincare e-commerce website for Gen Z");
    const good = JSON.stringify({ profile: a.profile, directions: a.directions.map((d) => ({ name: d.name, summary: d.summary, harmony: d.palette.harmony, paletteName: d.palette.name, paletteReasoning: d.palette.mood, colors: d.palette.colors, headingFont: d.fonts.heading, bodyFont: d.fonts.body, fontRationale: d.fontRationale, imageStyle: d.imageStyle, illustrationStyle: d.illustrationStyle, iconStyle: d.iconStyle, logoDirection: d.logoDirection, uiInspiration: d.uiInspiration, principles: d.principles, components: d.components, brandReferences: d.brandReferences })) });
    handler = (_m, _h, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end(OK(good)); };
    const { POST } = await import("../app/api/analyze/route");
    const j = await (await POST(new Request("http://x", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "7.7.7.7" }, body: JSON.stringify({ brief: "A premium skincare e-commerce website for Gen Z" }) }))).json();
    expect(j).toMatchObject({ source: "ai", provider: "gemini", notice: null }); expect(j.directions).toHaveLength(3);
    const { GET } = await import("../app/api/ai-status/route");
    const mk = (tok?: string) => new Request("http://x/api/ai-status?test=analyze", { headers: { "x-forwarded-for": "7.7.7.8", ...(tok ? { authorization: `Bearer ${tok}` } : {}) } });
    expect((await GET(mk())).status).toBe(401);
    const ok = await (await GET(mk("dev-token-dev-token-1234"))).json();
    expect(ok).toMatchObject({ working: true, test: "analyze", directions: 3 });
    delete process.env.AI_STATUS_TOKEN;
  });

  it("a Gemini failure in /api/analyze falls back to the labelled local engine", async () => {
    handler = (_m, _h, res) => err(res, 429, "RESOURCE_EXHAUSTED", "quota");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await import("../app/api/analyze/route");
    const res = await POST(new Request("http://x", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "7.7.7.9" }, body: JSON.stringify({ brief: "A premium skincare e-commerce website for Gen Z" }) }));
    const j = await res.json();
    expect(res.status).toBe(200); expect(j).toMatchObject({ source: "local", fallbackReason: "quota" }); expect(j.notice).toMatch(/rule-based/); expect(j.directions).toHaveLength(3);
  });
});
