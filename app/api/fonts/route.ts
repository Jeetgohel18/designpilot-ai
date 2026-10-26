import { FONTS } from "@/lib/fonts";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

// Live metadata from the Google Fonts Developer API (needs GOOGLE_FONTS_API_KEY — free).
let cache: { at: number; data: Record<string, { rank: number; lastModified: string; version: string }>; total: number } | null = null;

export async function GET(req: Request) {
  const rl = rateLimit(req, "fonts", 30);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const key = process.env.GOOGLE_FONTS_API_KEY;
  if (!key) return Response.json({ live: false, reason: "GOOGLE_FONTS_API_KEY is not set — showing the curated catalog only." });
  if (!cache || Date.now() - cache.at > 6 * 3600_000) {
    try {
      const res = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${key}&sort=popularity`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json() as { items: { family: string; lastModified: string; version: string }[] };
      const names = new Set(FONTS.map((f) => f.name));
      const data: NonNullable<typeof cache>["data"] = {};
      json.items.forEach((it, i) => { if (names.has(it.family)) data[it.family] = { rank: i + 1, lastModified: it.lastModified, version: it.version }; });
      cache = { at: Date.now(), data, total: json.items.length };
    } catch (e) {
      if (!cache) return Response.json({ live: false, reason: `Google Fonts API request failed (${e instanceof Error ? e.message : "error"}).` });
    }
  }
  return Response.json({ live: true, total: cache!.total, fonts: cache!.data });
}
