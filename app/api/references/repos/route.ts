import { rateLimit, tooMany } from "@/lib/server/ratelimit";

// Real open-source repositories from GitHub's public search API (no key; unauthenticated limit is low,
// so results are cached and rate-limit responses are reported honestly).
const cache = new Map<string, { at: number; data: unknown }>();

interface Repo { full_name: string; html_url: string; description: string | null; stargazers_count: number; language: string | null; license?: { spdx_id?: string | null } | null; owner?: { login?: string } }

export async function GET(req: Request) {
  const rl = rateLimit(req, "refs-repos", 10);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 3600_000) return Response.json(hit.data);
  try {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=8`, { headers: { Accept: "application/vnd.github+json", "User-Agent": "designpilot-ai" }, signal: AbortSignal.timeout(8000) });
    if (res.status === 403 || res.status === 429) return Response.json({ error: "GitHub's search limit was reached. Try again in a minute." }, { status: 429 });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { items?: Repo[] };
    const results = (json.items ?? []).filter((r) => /^https:\/\/github\.com\//.test(r.html_url)).map((r) => ({
      title: r.full_name, url: r.html_url, description: (r.description ?? "").slice(0, 160), stars: r.stargazers_count, language: r.language ?? "",
      license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : "",
    }));
    const data = { results };
    cache.set(q, { at: Date.now(), data });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `GitHub search failed (${e instanceof Error ? e.name : "error"}).` }, { status: 502 });
  }
}
