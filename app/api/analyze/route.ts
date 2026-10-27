import { z } from "zod";
import { analyzeLocal } from "@/lib/engine/analyze";
import { runAiAnalysis } from "@/lib/server/analysis";
import { aiConfigured, classifyError, logAiError, userMessage } from "@/lib/server/gemini";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

const body = z.object({
  brief: z.string().trim().min(15, "Describe your project in at least a sentence.").max(2500),
  settings: z.object({ industry: z.string().max(80).optional(), audience: z.string().max(200).optional(), platform: z.string().max(80).optional(), style: z.string().max(120).optional(), budget: z.string().max(80).optional(), constraints: z.string().max(400).optional() }).default({}),
});

export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = rateLimit(req, "analyze", 12);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const { brief, settings } = parsed.data;

  let notice: string;
  let reason: string;
  if (aiConfigured()) {
    try {
      const { model, profile, directions } = await runAiAnalysis(brief, settings);
      return Response.json({ source: "ai", provider: "gemini", model, profile, directions, notice: null });
    } catch (err) {
      const e = classifyError(err);
      logAiError("analyze", e);
      reason = e.kind;
      notice = userMessage(e.kind, "analysis");
    }
  } else {
    reason = "missing_key";
    notice = userMessage("missing_key", "analysis");
  }
  // Fallback: always labelled source:"local" so the UI never presents it as AI output.
  return Response.json({ source: "local", fallbackReason: reason, ...analyzeLocal(brief, settings), notice });
}
