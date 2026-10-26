import { AiError, aiConfigured, classifyError, generate, geminiModel, logAiError, userMessage } from "@/lib/server/gemini";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

const status = (k: Parameters<typeof userMessage>[0]) => userMessage(k, "analysis").replace(/ This analysis was generated.*$/, "");

export const maxDuration = 30;

// GET /api/ai-status            -> is a key configured? (never reveals the key)
// GET /api/ai-status?test=1     -> makes ONE tiny live Gemini call to prove the key works (counts toward free quota)
export async function GET(req: Request) {
  const configured = aiConfigured();
  const base = { provider: "gemini", model: geminiModel(), configured };
  if (new URL(req.url).searchParams.get("test") !== "1") return Response.json(base);
  const rl = rateLimit(req, "ai-test", 3);
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!configured) return Response.json({ ...base, working: false, message: status("missing_key") });
  try {
    const t = await generate({ system: "Reply with exactly one word.", prompt: "Say: ready", maxTokens: 20, timeoutMs: 15_000 });
    return Response.json({ ...base, working: true, message: `Gemini responded (${t.trim().slice(0, 20)}).` });
  } catch (err) {
    const e = err instanceof AiError ? err : classifyError(err);
    logAiError("ai-status", e);
    return Response.json({ ...base, working: false, reason: e.kind, message: status(e.kind) });
  }
}
