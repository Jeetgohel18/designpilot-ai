import { rateLimit, tooMany } from "@/lib/server/ratelimit";

const cache = new Map<string, { at: number; data: unknown }>();

// Real web results via the Brave Search API (needs BRAVE_SEARCH_API_KEY; has a free tier).
// Relevance is transparent: share of query keywords found in title/description/URL (see `score`).
export async function GET(req: Request) {
  const rl = rateLimit(req, "refs", 15);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return Response.json({ configured: false, reason: "BRAVE_SEARCH_API_KEY is not set." });
  const sp = new URL(req.url).searchParams;
  if (sp.get("status") === "1") return Response.json({ configured: true });
  const q = (sp.get("q") ?? "").trim().slice(0, 150);
  const keywords = (sp.get("kw") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 12);
  if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
  const ck = q + "|" + keywords.join(",");
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < 3600_000) return Response.json(hit.data);
  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=15&safesearch=moderate`, { headers: { Accept: "application/json", "X-Subscription-Token": key }, signal: AbortSignal.timeout(8000) });
    if (res.status === 429) return Response.json({ configured: true, error: "Search rate limit reached. Try again shortly." }, { status: 429 });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json() as { web?: { results?: { title: string; url: string; description?: string; meta_url?: { hostname?: string }; page_age?: string }[] } };
    const DESIGN_HOSTS = /(awwwards|behance|dribbble|land-book|godly|mobbin|pageflows|lapa\.ninja|siteinspire|pinterest|medium|case)/;
    const results = (json.web?.results ?? []).map((r) => {
      const hay = `${r.title} ${r.description ?? ""} ${r.url}`.toLowerCase();
      const matched = keywords.filter((k) => hay.includes(k));
      const keywordShare = keywords.length ? matched.length / keywords.length : 0;
      const designBonus = DESIGN_HOSTS.test(r.meta_url?.hostname ?? r.url) ? 0.15 : 0;
      return { title: r.title, url: r.url, description: r.description ?? "", host: r.meta_url?.hostname ?? new URL(r.url).hostname, age: r.page_age ?? null, matched, score: Math.min(1, +(keywordShare + designBonus).toFixed(2)), scoreMethod: `${matched.length}/${keywords.length} keywords matched${designBonus ? " + 0.15 design-source bonus" : ""}` };
    }).sort((a, b) => b.score - a.score);
    const data = { configured: true, results };
    cache.set(ck, { at: Date.now(), data });
    return Response.json(data);
  } catch (e) {
    return Response.json({ configured: true, error: `Search failed (${e instanceof Error ? e.message : "error"}).` }, { status: 502 });
  }
}
