import { z } from "zod";
import { aiResultSchema, analyzeLocal, fromAi } from "@/lib/engine/analyze";
import { aiConfigured, claude, extractJson } from "@/lib/server/anthropic";
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

export async function POST(req: Request) {
  const rl = rateLimit(req, "analyze", 12);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const { brief, settings } = parsed.data;

  let notice: string | null = null;
  if (aiConfigured()) {
    try {
      const text = await claude(SYSTEM, `Brief: ${brief}\nSettings: ${JSON.stringify(settings)}`);
      const result = fromAi(aiResultSchema.parse(extractJson(text)));
      return Response.json({ source: "ai", ...result, notice: null });
    } catch (err) {
      notice = "The AI service didn't return a usable answer, so this analysis was generated locally instead.";
      console.error("[analyze] AI failed:", err instanceof Error ? err.message : err);
    }
  } else {
    notice = "No AI key is configured, so this analysis comes from DesignPilot's built-in rule-based engine (keyword and industry matching). Add ANTHROPIC_API_KEY for full AI analysis.";
  }
  return Response.json({ source: "local", ...analyzeLocal(brief, settings), notice });
}
