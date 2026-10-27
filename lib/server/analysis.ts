import { aiResultSchema, fromAi } from "@/lib/engine/analyze";
import { AiError, extractJson, generateDetailed } from "@/lib/server/gemini";
import { ROLES } from "@/lib/types";
import type { ProjectSettings } from "@/lib/types";

const SYSTEM = `You are a senior design strategist. Analyse the project brief and return ONLY a JSON object (no markdown) with this shape:
{"profile":{"projectType","industry","niche","audience","userNeeds":[],"businessGoals":[],"platforms":[],"brandPersonality":[],"visualMood":[],"designStyle","typography","colorDirection","imageDirection","keywords":[],"challenges":[],"summary"},
"directions":[exactly 3 objects, each: {"name","summary","harmony","paletteName","paletteReasoning","colors":{${ROLES.map((r) => `"${r}":"#RRGGBB"`).join(",")}},"headingFont","bodyFont","fontRationale","imageStyle","illustrationStyle","iconStyle","logoDirection","uiInspiration":[],"principles":[],"components":[],"brandReferences":[]}]}
Rules: the three directions must be clearly different. Fonts must be real Google Fonts family names. Colors are for a LIGHT theme; text on background must reach 7:1 contrast and primary on background 4.5:1. brandReferences are names of real, well-known brands in this industry for the designer to research — never URLs, never claims about their exact colors or fonts. Be specific to this brief; no generic filler.`;

/** Time budget for a full analysis. Must stay below the route's maxDuration (60s). */
export const ANALYSIS_BUDGET_MS = 50_000;

/** The real AI project-analysis pipeline: Gemini call -> JSON extraction -> schema validation. Shared by /api/analyze and the diagnostics. */
export async function runAiAnalysis(brief: string, settings: ProjectSettings) {
  const { text, model, elapsedMs } = await generateDetailed({ system: SYSTEM, prompt: `Brief: ${brief}\nSettings: ${JSON.stringify(settings)}`, json: true, maxTokens: 8000, totalMs: ANALYSIS_BUDGET_MS, thinking: "low" });
  const parsed = aiResultSchema.safeParse(extractJson(text));
  if (!parsed.success) throw new AiError("bad_output", { model, elapsedMs });
  return { ...fromAi(parsed.data), model, elapsedMs };
}
