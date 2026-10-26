// Minimal Anthropic Messages API client (server-side only; the key never reaches the browser).
export const aiConfigured = () => !!process.env.ANTHROPIC_API_KEY;

export async function claude(system: string, user: string, maxTokens = 4000, signal?: AbortSignal): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    signal: signal ?? AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  return (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
}

export function extractJson(text: string): unknown {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON in model output");
  return JSON.parse(text.slice(start, end + 1));
}
