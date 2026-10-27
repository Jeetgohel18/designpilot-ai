import { rateLimit, tooMany } from "@/lib/server/ratelimit";

// Real App Store results from Apple's public iTunes Search API (no key, free).
// Thumbnails are the app's own icon/screenshots as returned by Apple; nothing is generated.
const cache = new Map<string, { at: number; data: unknown }>();
const https = (u?: string) => (u && /^https:\/\//.test(u) ? u : undefined);

interface Hit { trackName?: string; trackViewUrl?: string; artworkUrl512?: string; artworkUrl100?: string; screenshotUrls?: string[]; primaryGenreName?: string; sellerName?: string; description?: string; averageUserRating?: number }

export async function GET(req: Request) {
  const rl = rateLimit(req, "refs-apps", 15);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 3600_000) return Response.json(hit.data);
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&limit=10&country=us`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (res.status === 429 || res.status === 403) return Response.json({ error: "The App Store search is rate-limited right now. Try again shortly." }, { status: 429 });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { results?: Hit[] };
    const results = (json.results ?? []).filter((r) => r.trackName && https(r.trackViewUrl)).map((r) => ({
      title: r.trackName as string, url: r.trackViewUrl as string, thumb: https(r.screenshotUrls?.[0]) ?? https(r.artworkUrl512) ?? https(r.artworkUrl100),
      genre: r.primaryGenreName ?? "", seller: r.sellerName ?? "", description: (r.description ?? "").replace(/\s+/g, " ").slice(0, 160), rating: r.averageUserRating ?? null,
    }));
    const data = { results };
    cache.set(q, { at: Date.now(), data });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `App Store search failed (${e instanceof Error ? e.name : "error"}).` }, { status: 502 });
  }
}
