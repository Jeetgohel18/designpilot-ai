import { z } from "zod";
import { aiResultSchema, analyzeLocal, fromAi } from "@/lib/engine/analyze";
import { AiError, aiConfigured, classifyError, extractJson, generate, logAiError, userMessage } from "@/lib/server/gemini";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";
import { ROLES } from "@/lib/types";

const body = z.object({
  brief: z.string().trim().min(15, "Describe your project in at least a sentence.").max(2500),
  settings: z.object({ industry: z.string().max(80).optional(), audience: z.string().max(200).optional(), platform: z.string().max(80).optional(), style: z.string().max(120).optional(), budget: z.string().max(80).optional() }).default({}),
});

const SYSTEM = `You are a senior design strategist. Analyse the project brief and return ONLY a JSON object (no markdown) with this shape:
{"profile":{"projectType","industry","niche","audience","userNeeds":[],"businessGoals":[],"platforms":[],"brandPersonality":[],"visualMood":[],"designStyle","typography","colorDirection","imageDirection","keywords":[],"challenges":[],"summary"},
"directions":[exactly 3 objects, each: {"name","summary","harmony","paletteName","paletteReasoning","colors":{${ROLES.map((r) => `"${r}":"#RRGGBB"`).join(",")}},"headingFont","bodyFont","fontRationale","imageStyle","illustrationStyle","iconStyle","logoDirection","uiInspiration":[],"principles":[],"components":[],"brandReferences":[]}]}
Rules: the three directions must be clearly different. Fonts must be real Google Fonts family names. Colors are for a LIGHT theme; text on background must reach 7:1 contrast and primary on background 4.5:1. brandReferences are names of real, well-known brands in this industry for the designer to research — never URLs, never claims about their exact colors or fonts. Be specific to this brief; no generic filler.`;

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
      const text = await generate({ system: SYSTEM, prompt: `Brief: ${brief}\nSettings: ${JSON.stringify(settings)}`, json: true, maxTokens: 8000 });
      const result = aiResultSchema.safeParse(extractJson(text));
      if (!result.success) throw new AiError("bad_output");
      return Response.json({ source: "ai", provider: "gemini", ...fromAi(result.data), notice: null });
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
