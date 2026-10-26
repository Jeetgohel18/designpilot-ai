import { z } from "zod";
import { localAssistant } from "@/lib/engine/assistant";
import { aiConfigured, classifyError, generate, logAiError, userMessage } from "@/lib/server/gemini";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";
import { designBrief, directionOf } from "@/lib/engine/handoff";
import type { Project } from "@/lib/types";

export const maxDuration = 30;

const body = z.object({
  message: z.string().trim().min(2).max(800),
  project: z.custom<Project>((v) => !!v && typeof v === "object" && Array.isArray((v as Project).directions)),
});

export async function POST(req: Request) {
  const rl = rateLimit(req, "assistant", 20);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { message, project } = parsed.data;
  const local = localAssistant(message, project);

  let notice: string | null = null;
  if (aiConfigured()) {
    try {
      const d = directionOf(project);
      const reply = await generate({
        system: "You are DesignPilot's design assistant embedded in a project workspace. Answer concisely (max ~150 words) using ONLY the project context. Give concrete, opinionated design advice. Never invent URLs, brands' exact hex values or statistics; say when something is a suggestion. Plain text, no markdown headings.",
        prompt: `Project context:\n${designBrief(project).slice(0, 5000)}\n\nSelected direction palette: ${d ? JSON.stringify(d.palette.colors) : "none"}\n\nUser question: ${message}`,
        maxTokens: 800, timeoutMs: 25_000,
      });
      return Response.json({ source: "ai", provider: "gemini", reply: reply.trim(), action: local.action });
    } catch (err) {
      const e = classifyError(err);
      logAiError("assistant", e);
      notice = userMessage(e.kind, "assistant");
    }
  }
  return Response.json({ source: "local", ...local, notice });
}
