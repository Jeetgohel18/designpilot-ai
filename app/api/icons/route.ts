import { rateLimit, tooMany } from "@/lib/server/ratelimit";

const cache = new Map<string, { at: number; data: unknown }>();

// Live icon search through the public Iconify API (no key needed). Every set has its own licence.
export async function GET(req: Request) {
  const rl = rateLimit(req, "icons", 30);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  if (!q) return Response.json({ error: "Missing q" }, { status: 400 });
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 3600_000) return Response.json(hit.data);
  try {
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=48&prefixes=lucide,ph,tabler,heroicons,iconoir,mdi-light,solar`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json() as { icons: string[]; collections: Record<string, { name: string; license: { title: string; spdx?: string; url?: string } }> };
    const data = { icons: json.icons, collections: json.collections };
    cache.set(q, { at: Date.now(), data });
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: `Icon search is unavailable right now (${e instanceof Error ? e.message : "network"}). Use the library links instead.` }, { status: 502 });
  }
}
