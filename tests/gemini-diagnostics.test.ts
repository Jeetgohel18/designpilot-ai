import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError } from "@google/genai";
import { classifyError, redact, isDeveloper, parseProviderError, logAiError } from "../lib/server/gemini";

// Google wraps errors as JSON inside the SDK error message, like this:
const google = (code: number, status: string, message: string, reason?: string) =>
  new ApiError({ status: code, message: JSON.stringify({ error: { code, message, status, ...(reason ? { details: [{ "@type": "x", reason }] } : {}) } }) });

describe("diagnostic categories", () => {
  const cases: [string, ApiError | Error, string, Partial<{ httpStatus: number; providerStatus: string; providerReason: string }>][] = [
    ["invalid credentials", google(400, "INVALID_ARGUMENT", "API key not valid. Please pass a valid API key.", "API_KEY_INVALID"), "invalid_key", { httpStatus: 400, providerReason: "API_KEY_INVALID" }],
    ["unauthenticated", google(401, "UNAUTHENTICATED", "Request had invalid authentication credentials."), "invalid_key", { httpStatus: 401 }],
    ["permission denied", google(403, "PERMISSION_DENIED", "The caller does not have permission"), "permission_denied", { httpStatus: 403, providerStatus: "PERMISSION_DENIED" }],
    ["model not found", google(404, "NOT_FOUND", "models/gemini-2.5-flash is no longer available to new users."), "model_not_found", { httpStatus: 404, providerStatus: "NOT_FOUND" }],
    ["quota exhausted", google(429, "RESOURCE_EXHAUSTED", "You exceeded your current quota"), "quota", { httpStatus: 429, providerStatus: "RESOURCE_EXHAUSTED" }],
    ["invalid request", google(400, "INVALID_ARGUMENT", "Unable to submit request because thinking budget is invalid"), "invalid_request", { httpStatus: 400 }],
    ["precondition (e.g. region / free tier not available)", google(400, "FAILED_PRECONDITION", "User location is not supported for the API use."), "invalid_request", { httpStatus: 400 }],
    ["timeout (abort)", Object.assign(new Error("The operation was aborted"), { name: "AbortError" }), "timeout", {}],
    ["timeout (504)", google(504, "DEADLINE_EXCEEDED", "Deadline expired"), "timeout", { httpStatus: 504 }],
    ["temporary provider failure (503)", google(503, "UNAVAILABLE", "The model is overloaded."), "provider", { httpStatus: 503, providerStatus: "UNAVAILABLE" }],
    ["internal (500)", google(500, "INTERNAL", "Internal error"), "provider", { httpStatus: 500 }],
    ["network", new TypeError("fetch failed"), "network", {}],
  ];
  for (const [name, err, kind, extra] of cases) {
    it(name, () => { const e = classifyError(err); expect(e.kind).toBe(kind); for (const [k, v] of Object.entries(extra)) expect((e.diagnostics as Record<string, unknown>)[k]).toBe(v); });
  }
  it("parses Google's JSON error body", () => {
    const p = parseProviderError(google(404, "NOT_FOUND", "gone"));
    expect(p).toMatchObject({ httpStatus: 404, providerStatus: "NOT_FOUND", message: "gone" });
  });
  it("ignores non-enum provider status strings (no free-text injection)", () => {
    const p = parseProviderError(new ApiError({ status: 500, message: JSON.stringify({ error: { code: 500, status: "see https://evil.example now", message: "x" } }) }));
    expect(p.providerStatus).toBeUndefined();
  });
});

describe("redaction", () => {
  beforeEach(() => { process.env.GEMINI_API_KEY = "my-very-secret-test-key-0001"; });
  afterEach(() => { delete process.env.GEMINI_API_KEY; vi.restoreAllMocks(); });
  it("removes keys, bearer tokens and key= params", () => {
    const t = redact("url https://x/v1?key=AIzaSyA1234567890abcdefghijkLMNOP&alt=sse hdr Bearer abcdef1234567890 x-goog-api-key: AIzaSyA1234567890abcdefghijkLMNOP mine my-very-secret-test-key-0001");
    expect(t).not.toMatch(/AIza|abcdef1234567890|my-very-secret/);
    expect(t).toContain("[redacted");
  });
  it("caps length", () => { expect(redact("a".repeat(2000)).length).toBeLessThan(400); });
  it("stored detail and log lines never contain the key", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const e = classifyError(google(403, "PERMISSION_DENIED", "denied for key my-very-secret-test-key-0001 AIzaSyA1234567890abcdefghijkLMNOP"));
    logAiError("t", e);
    const all = JSON.stringify(spy.mock.calls) + JSON.stringify(e.diagnostics);
    expect(all).not.toMatch(/my-very-secret|AIzaSyA/);
    expect(all).toContain("PERMISSION_DENIED");
  });
});

describe("developer authorization", () => {
  afterEach(() => { delete process.env.AI_STATUS_TOKEN; });
  const r = (h?: string) => new Request("http://x", { headers: h ? { authorization: h } : {} });
  it("is off when no token is configured", () => { expect(isDeveloper(r("Bearer anything-anything-1234"))).toBe(false); });
  it("rejects short configured tokens", () => { process.env.AI_STATUS_TOKEN = "short"; expect(isDeveloper(r("Bearer short"))).toBe(false); });
  it("accepts only the exact bearer token", () => {
    process.env.AI_STATUS_TOKEN = "correct-horse-battery-staple";
    expect(isDeveloper(r("Bearer correct-horse-battery-staple"))).toBe(true);
    expect(isDeveloper(r("Bearer wrong-horse-battery-staple!"))).toBe(false);
    expect(isDeveloper(r())).toBe(false);
    expect(isDeveloper(r("correct-horse-battery-staple"))).toBe(false);
  });
});

describe("model fallback + /api/ai-status responses", () => {
  const OLD = process.env;
  beforeEach(() => { vi.resetModules(); process.env = { ...OLD, GEMINI_API_KEY: "test-key-test-key-12345", AI_STATUS_TOKEN: "dev-token-dev-token-1234" }; delete process.env.GEMINI_MODEL; });
  afterEach(() => { process.env = OLD; vi.doUnmock("@google/genai"); vi.restoreAllMocks(); });

  function mockSdk(impl: (model: string) => unknown, models: string[] = []) {
    const calls: string[] = [];
    vi.doMock("@google/genai", async () => {
      const real = await vi.importActual<typeof import("@google/genai")>("@google/genai");
      class GoogleGenAI {
        models = {
          generateContent: async ({ model }: { model: string }) => { calls.push(model); return impl(model); },
          list: async () => (async function* () { for (const name of models) yield { name: `models/${name}`, supportedActions: ["generateContent"] }; })(),
        };
      }
      return { ...real, GoogleGenAI };
    });
    return calls;
  }
  const get = async (qs: string, token?: string, ip = "9.9.9.9") => {
    const { GET } = await import("../app/api/ai-status/route");
    return GET(new Request("http://x/api/ai-status" + qs, { headers: { "x-forwarded-for": ip, ...(token ? { authorization: `Bearer ${token}` } : {}) } }));
  };

  it("moves to the next default model ONLY on 404, and reports the model used", async () => {
    const calls = mockSdk((m) => { if (m === "gemini-3.5-flash-lite") throw google(404, "NOT_FOUND", "not found"); return { text: "ready" }; });
    const j = await (await get("?test=1", undefined, "1.0.0.1")).json();
    expect(j.working).toBe(true); expect(j.modelUsed).toBe("gemini-3.1-flash-lite"); expect(calls).toEqual(["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });
  it("timeouts report the model and elapsed time to developers only, and do not switch models", async () => {
    const calls = mockSdk(() => { throw Object.assign(new Error("The operation was aborted"), { name: "AbortError" }); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const pub = await (await get("?test=1", undefined, "1.0.1.1")).json();
    expect(pub.reason).toBe("timeout"); expect(pub.model).toBeUndefined(); expect(pub.elapsedMs).toBeUndefined();
    const dev = await (await get("?test=1", "dev-token-dev-token-1234", "1.0.1.2")).json();
    expect(dev.model).toBe("gemini-3.5-flash-lite"); expect(typeof dev.elapsedMs).toBe("number"); expect(calls).toHaveLength(2);
  });
  it("does not try other models for non-404 errors (e.g. quota)", async () => {
    const calls = mockSdk(() => { throw google(429, "RESOURCE_EXHAUSTED", "quota"); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const j = await (await get("?test=1", undefined, "1.0.0.2")).json();
    expect(j.reason).toBe("quota"); expect(calls).toHaveLength(1);
  });
  it("an explicit GEMINI_MODEL is never substituted", async () => {
    process.env.GEMINI_MODEL = "gemini-custom";
    const calls = mockSdk(() => { throw google(404, "NOT_FOUND", "nf"); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const j = await (await get("?test=1", undefined, "1.0.0.3")).json();
    expect(j.reason).toBe("model_not_found"); expect(calls).toEqual(["gemini-custom"]);
  });
  it("public response: safe category only; developer response: adds HTTP status + Google status + redacted detail", async () => {
    mockSdk(() => { throw google(403, "PERMISSION_DENIED", "denied test-key-test-key-12345"); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const pub = await (await get("?test=1", undefined, "1.0.0.4")).json();
    expect(pub).toMatchObject({ working: false, reason: "permission_denied" });
    expect(pub.httpStatus).toBeUndefined(); expect(pub.detail).toBeUndefined(); expect(pub.providerStatus).toBeUndefined(); expect(pub.message).not.toMatch(/This analysis/);
    const bad = await (await get("?test=1", "wrong-token-wrong-token-1", "1.0.0.5")).json();
    expect(bad.detail).toBeUndefined();
    const dev = await (await get("?test=1", "dev-token-dev-token-1234", "1.0.0.6")).json();
    expect(dev).toMatchObject({ developerAccess: true, httpStatus: 403, providerStatus: "PERMISSION_DENIED" });
    expect(JSON.stringify(dev)).not.toContain("test-key-test-key-12345");
  });
  it("model list is developer-only and shows which configured models exist", async () => {
    mockSdk(() => ({ text: "x" }), ["gemini-3.5-flash-lite", "gemini-3.8-flash"]);
    expect((await get("?models=1", undefined, "1.0.0.7")).status).toBe(401);
    const j = await (await get("?models=1", "dev-token-dev-token-1234", "1.0.0.8")).json();
    expect(j.available).toContain("gemini-3.8-flash");
    expect(j.configuredModelsAvailable).toEqual({ "gemini-3.5-flash-lite": true, "gemini-3.1-flash-lite": false });
  });
  it("status never contains the key", async () => {
    const t = JSON.stringify(await (await get("", undefined, "1.0.0.9")).json());
    expect(t).not.toContain("test-key-test-key"); expect(t).toContain('"configured":true');
  });
});
