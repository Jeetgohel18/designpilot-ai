import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError } from "@google/genai";
import { analyzeLocal } from "../lib/engine/analyze";

const brief = "A premium skincare e-commerce website for Gen Z with a luxurious minimal aesthetic";

describe("classifyError", async () => {
  const { classifyError, userMessage } = await import("../lib/server/gemini");
  it("maps provider failures to safe categories", () => {
    expect(classifyError(new ApiError({ message: "x", status: 429 })).kind).toBe("quota");
    expect(classifyError(new ApiError({ message: "API key not valid. Please pass a valid API key.", status: 400 })).kind).toBe("invalid_key");
    expect(classifyError(new ApiError({ message: "denied", status: 403 })).kind).toBe("invalid_key");
    expect(classifyError(new ApiError({ message: "boom", status: 503 })).kind).toBe("provider");
    const t = new Error("timed out"); t.name = "TimeoutError";
    expect(classifyError(t).kind).toBe("timeout");
    expect(classifyError("weird").kind).toBe("provider");
  });
  it("user messages never contain provider text", () => {
    for (const k of ["missing_key", "invalid_key", "quota", "blocked", "bad_output", "timeout", "provider"] as const) expect(userMessage(k, "analysis")).toMatch(/rule-based/);
  });
});

describe("routes with Gemini mocked", () => {
  beforeEach(() => { vi.resetModules(); vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); vi.doUnmock("../lib/server/gemini"); delete process.env.GEMINI_API_KEY; });
  const req = (b: unknown, ip = "1.1.1.1") => new Request("http://x/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(b) });

  async function load(generate: () => Promise<string>, configured = true) {
    vi.resetModules();
    vi.doMock("../lib/server/gemini", async () => { const real = await vi.importActual<typeof import("../lib/server/gemini")>("../lib/server/gemini"); return { ...real, aiConfigured: () => configured, generate }; });
    return (await import("../app/api/analyze/route")).POST;
  }
  const a = analyzeLocal(brief);
  const aiJson = JSON.stringify({ profile: a.profile, directions: a.directions.map((d) => ({ name: d.name, summary: d.summary, harmony: d.palette.harmony, paletteName: d.palette.name, paletteReasoning: d.palette.mood, colors: d.palette.colors, headingFont: d.fonts.heading, bodyFont: d.fonts.body, fontRationale: d.fontRationale, imageStyle: d.imageStyle, illustrationStyle: d.illustrationStyle, iconStyle: d.iconStyle, logoDirection: d.logoDirection, uiInspiration: d.uiInspiration, principles: d.principles, components: d.components, brandReferences: d.brandReferences })) });

  it("uses Gemini output when valid and labels it ai", async () => {
    const POST = await load(async () => "```json\n" + aiJson + "\n```");
    const j = await (await POST(req({ brief }))).json();
    expect(j.source).toBe("ai"); expect(j.provider).toBe("gemini"); expect(j.directions).toHaveLength(3); expect(j.notice).toBeNull();
  });
  it("falls back, labelled, when the key is missing", async () => {
    const POST = await load(async () => { throw new Error("should not be called"); }, false);
    const j = await (await POST(req({ brief }, "2.2.2.2"))).json();
    expect(j.source).toBe("local"); expect(j.fallbackReason).toBe("missing_key"); expect(j.notice).toMatch(/GEMINI_API_KEY/); expect(j.directions).toHaveLength(3);
  });
  it("falls back on quota, invalid key and garbage output without a 500", async () => {
    for (const [i, [err, reason]] of ([[new ApiError({ message: "quota", status: 429 }), "quota"], [new ApiError({ message: "API key not valid", status: 400 }), "invalid_key"], [null, "bad_output"]] as const).entries()) {
      const POST = await load(async () => { if (err) throw err; return "not json at all"; });
      const res = await POST(req({ brief }, `3.3.3.${i}`));
      const j = await res.json();
      expect(res.status).toBe(200); expect(j.source).toBe("local"); expect(j.fallbackReason).toBe(reason);
    }
  });
  it("never logs the key", async () => {
    process.env.GEMINI_API_KEY = "SECRET-KEY-VALUE-123";
    const POST = await load(async () => { throw new ApiError({ message: "bad SECRET-KEY-VALUE-123", status: 403 }); });
    await POST(req({ brief }, "4.4.4.4"));
    const logged = JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls);
    expect(logged).not.toContain("SECRET-KEY-VALUE-123");
  });
  it("assistant uses Gemini when configured and falls back with a notice", async () => {
    vi.doMock("../lib/server/gemini", async () => { const real = await vi.importActual<typeof import("../lib/server/gemini")>("../lib/server/gemini"); return { ...real, aiConfigured: () => true, generate: async () => "Use a serif heading." }; });
    let POST = (await import("../app/api/assistant/route")).POST;
    const project = { ...a, name: "t", brief, settings: {}, selectedDirection: null, directions: a.directions, profile: a.profile };
    let j = await (await POST(req({ message: "Which font pairing is best?", project }, "5.5.5.5"))).json();
    expect(j.source).toBe("ai"); expect(j.reply).toBe("Use a serif heading.");
    vi.resetModules();
    vi.doMock("../lib/server/gemini", async () => { const real = await vi.importActual<typeof import("../lib/server/gemini")>("../lib/server/gemini"); return { ...real, aiConfigured: () => true, generate: async () => { throw new ApiError({ message: "q", status: 429 }); } }; });
    POST = (await import("../app/api/assistant/route")).POST;
    j = await (await POST(req({ message: "Which font pairing is best?", project }, "6.6.6.6"))).json();
    expect(j.source).toBe("local"); expect(j.notice).toMatch(/free Gemini quota/); expect(j.reply.length).toBeGreaterThan(10);
  });
});
