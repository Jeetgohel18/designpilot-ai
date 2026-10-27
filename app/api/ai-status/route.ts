import { AiError, aiConfigured, classifyError, generateDetailed, isDeveloper, listUsableModels, logAiError, modelCandidates, userMessage } from "@/lib/server/gemini";
import { runAiAnalysis } from "@/lib/server/analysis";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

export const maxDuration = 60;

// Public:
//   GET /api/ai-status           -> is a key configured, which model(s) would be used (never the key)
//   GET /api/ai-status?test=1    -> ONE tiny live Gemini call. Returns working true/false + a SAFE category + friendly message.
// Developer-only (header "Authorization: Bearer <AI_STATUS_TOKEN>", token set in your hosting env vars):
//   adds httpStatus, providerStatus, providerReason and a redacted/truncated detail to ?test=1,
//   plus GET /api/ai-status?test=analyze (runs the real analysis pipeline end to end)
//   and GET /api/ai-status?models=1 lists the model IDs your key can use (verifies GEMINI_MODEL against Google's live list).
const tail = /\s+This (analysis|answer) .*$/;
const friendly = (k: Parameters<typeof userMessage>[0]) => userMessage(k, "analysis").replace(tail, "");

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const configured = aiConfigured();
  const dev = isDeveloper(req);
  const base = { provider: "gemini", models: modelCandidates(), configured, developerAccess: dev };
  const headers = { "Cache-Control": "no-store" };

  if (sp.get("models") === "1") {
    if (!dev) return Response.json({ error: "Developer access required (Authorization: Bearer <AI_STATUS_TOKEN>)." }, { status: 401, headers });
    const rl = rateLimit(req, "ai-models", 6);
    if (!rl.ok) return tooMany(rl.retryAfter);
    try {
      const available = await listUsableModels();
      return Response.json({ ...base, available, configuredModelsAvailable: Object.fromEntries(modelCandidates().map((m) => [m, available.includes(m)])) }, { headers });
    } catch (err) {
      const e = classifyError(err); logAiError("ai-status/models", e);
      return Response.json({ ...base, working: false, reason: e.kind, message: friendly(e.kind), ...e.diagnostics }, { headers });
    }
  }

  if (sp.get("test") === "analyze") {
    // Runs the REAL analysis pipeline (heavier: uses more free quota), so developer-only.
    if (!dev) return Response.json({ error: "Developer access required (Authorization: Bearer <AI_STATUS_TOKEN>)." }, { status: 401, headers });
    const rl = rateLimit(req, "ai-analyze-test", 3);
    if (!rl.ok) return tooMany(rl.retryAfter);
    if (!configured) return Response.json({ ...base, working: false, reason: "missing_key", message: friendly("missing_key") }, { headers });
    try {
      const r = await runAiAnalysis("A premium skincare e-commerce website for Gen Z with a minimal luxury feel and organic ingredients.", {});
      return Response.json({ ...base, working: true, test: "analyze", modelUsed: r.model, elapsedMs: r.elapsedMs, directions: r.directions.length, message: "Real project analysis succeeded and passed schema validation." }, { headers });
    } catch (err) {
      const e = err instanceof AiError ? err : classifyError(err);
      logAiError("ai-status/analyze", e);
      return Response.json({ ...base, working: false, test: "analyze", reason: e.kind, message: friendly(e.kind), ...e.diagnostics }, { headers });
    }
  }

  if (sp.get("test") !== "1") return Response.json(base, { headers });

  const rl = rateLimit(req, "ai-test", dev ? 12 : 3);
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!configured) return Response.json({ ...base, working: false, reason: "missing_key", message: friendly("missing_key") }, { headers });
  try {
    const r = await generateDetailed({ system: "Reply with exactly one word.", prompt: "Say: ready", maxTokens: 32, totalMs: 35_000, thinking: "minimal" });
    return Response.json({ ...base, working: true, modelUsed: r.model, elapsedMs: r.elapsedMs, message: "Gemini responded successfully." }, { headers });
  } catch (err) {
    const e = err instanceof AiError ? err : classifyError(err);
    logAiError("ai-status", e);
    const pub = { ...base, working: false, reason: e.kind, message: friendly(e.kind) };
    // Raw provider details only for the authorized developer; the public never sees them.
    return Response.json(dev ? { ...pub, ...e.diagnostics } : pub, { headers });
  }
}
