import { z } from "zod";
import { aiIdeasSchema, ideaGroupSchema } from "@/lib/engine/brainstorm";
import { AiError, aiConfigured, classifyError, extractJson, generateDetailed, logAiError, userMessage } from "@/lib/server/gemini";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";
import { IDEA_GROUPS } from "@/lib/types";

export const maxDuration = 30;

const str = (n: number) => z.string().trim().max(n);
const body = z.object({
  mode: z.enum(["generate", "refine"]),
  group: ideaGroupSchema.optional(),
  idea: str(220).optional(),
  existing: z.array(str(220)).max(40).default([]),
  context: z.object({ brief: str(2500), summary: str(1200), industry: str(120), audience: str(300), direction: str(120).optional(), principles: z.array(str(120)).max(8).optional() }),
});

const SYSTEM = `You are a senior product designer facilitating a brainstorm. Reply with ONLY JSON: {"ideas":[{"group":"<one of: ${IDEA_GROUPS.join(" | ")}>","text":"<one concrete idea, max 200 chars>"}]}.
Ideas must be specific to the project context, concrete and different from the existing ideas. Never invent statistics, competitors, URLs or facts about the business; frame unknowns as questions.`;

export async function POST(req: Request) {
  const rl = rateLimit(req, "brainstorm", 15);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { mode, group, idea, existing, context } = parsed.data;
  if (mode === "refine" && !idea) return Response.json({ error: "Nothing to refine" }, { status: 400 });

  if (!aiConfigured()) {
    return Response.json({ source: "unavailable", reason: "missing_key", ideas: [], notice: userMessage("missing_key", "assistant").replace(/ This answer.*$/, "") }, { status: mode === "refine" ? 503 : 200 });
  }
  const ask = mode === "generate"
    ? `Generate 5 new ideas${group ? ` for the group "${group}"` : " spread across the groups"}.`
    : `Refine this idea into 3 clearer, more actionable alternatives, all in the group "${group ?? "Features"}": "${idea}"`;
  try {
    const { text } = await generateDetailed({
      system: SYSTEM, json: true, maxTokens: 900, totalMs: 24_000, thinking: "minimal",
      prompt: `Project brief: ${context.brief}\nSummary: ${context.summary}\nIndustry: ${context.industry}\nAudience: ${context.audience}\n${context.direction ? `Selected direction: ${context.direction} (${(context.principles ?? []).join("; ")})\n` : ""}Existing ideas (do not repeat): ${existing.slice(0, 40).join(" | ") || "none"}\n\n${ask}`,
    });
    const r = aiIdeasSchema.safeParse(extractJson(text));
    if (!r.success) throw new AiError("bad_output");
    const ideas = r.data.ideas.map((i) => ({ group: mode === "refine" ? group ?? i.group : i.group, text: i.text }));
    return Response.json({ source: "ai", provider: "gemini", ideas });
  } catch (err) {
    const e = classifyError(err);
    logAiError("brainstorm", e);
    // The UI keeps all existing work; "generate" falls back to local ideas (labelled), "refine" reports the failure.
    return Response.json({ source: "unavailable", reason: e.kind, ideas: [], notice: userMessage(e.kind, "assistant").replace(/ This answer.*$/, "") }, { status: mode === "refine" ? 503 : 200 });
  }
}
