import { rateLimit, tooMany } from "@/lib/server/ratelimit";

const cache = new Map<string, { at: number; data: unknown }>();

// Live photo search via the Unsplash API (needs UNSPLASH_ACCESS_KEY — free demo tier, 50 req/hour).
// Unsplash requires attribution to the photographer and to Unsplash, so we always return and show it.
export async function GET(req: Request) {
  const rl = rateLimit(req, "images", 20);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return Response.json({ configured: false, reason: "UNSPLASH_ACCESS_KEY is not set." });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 3600_000) return Response.json(hit.data);
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=12&content_filter=high`, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(8000) });
    if (res.status === 403 || res.status === 429) return Response.json({ configured: true, error: "Unsplash rate limit reached (free tier: 50 requests/hour). Try again later." }, { status: 429 });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json() as { results: { id: string; alt_description: string | null; urls: { small: string }; links: { html: string }; user: { name: string; links: { html: string } } }[] };
    const utm = "?utm_source=designpilot&utm_medium=referral";
    const data = { configured: true, photos: json.results.map((p) => ({ id: p.id, alt: p.alt_description ?? q, thumb: p.urls.small, page: p.links.html + utm, author: p.user.name, authorUrl: p.user.links.html + utm })), license: "Unsplash License" };
    cache.set(q, { at: Date.now(), data });
    return Response.json(data);
  } catch (e) {
    return Response.json({ configured: true, error: `Unsplash request failed (${e instanceof Error ? e.message : "error"}).` }, { status: 502 });
  }
}
