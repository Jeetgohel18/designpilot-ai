import { rateLimit, tooMany } from "@/lib/server/ratelimit";

// Serves a Google Fonts TTF so the browser can turn text into vector outlines for SVG/PDF exports.
// Only fonts.googleapis.com / fonts.gstatic.com are contacted (fixed hosts, validated family names), so there is no SSRF surface.
// Google Fonts families are open-licensed (OFL/Apache); no key or billing is involved.
const FAMILY = /^[A-Za-z0-9][A-Za-z0-9 ]{1,39}$/;
const cache = new Map<string, { at: number; buf: ArrayBuffer }>();

async function ttfFor(family: string, weight: number): Promise<ArrayBuffer | null> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, { signal: AbortSignal.timeout(8000) });
  if (!css.ok) return null;
  const m = /url\((https:\/\/fonts\.gstatic\.com\/[^)\s]+\.ttf)\)/.exec(await css.text());
  if (!m) return null;
  const bin = await fetch(m[1], { signal: AbortSignal.timeout(10_000) });
  if (!bin.ok) return null;
  const buf = await bin.arrayBuffer();
  return buf.byteLength > 0 && buf.byteLength < 4_000_000 ? buf : null;
}

export async function GET(req: Request) {
  const rl = rateLimit(req, "font-file", 60);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const sp = new URL(req.url).searchParams;
  const family = (sp.get("family") ?? "").trim();
  const weight = Math.round(Number(sp.get("weight") ?? 400) / 100) * 100;
  if (!FAMILY.test(family) || !(weight >= 100 && weight <= 900)) return Response.json({ error: "Invalid font request" }, { status: 400 });
  const key = `${family}@${weight}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return new Response(hit.buf, { headers: { "Content-Type": "font/ttf", "Cache-Control": "public, max-age=86400" } });
  try {
    const buf = (await ttfFor(family, weight)) ?? (weight !== 400 ? await ttfFor(family, 400) : null);
    if (!buf) return Response.json({ error: "Font not found on Google Fonts" }, { status: 404 });
    cache.set(key, { at: Date.now(), buf });
    return new Response(buf, { headers: { "Content-Type": "font/ttf", "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ error: "Font service unavailable" }, { status: 502 });
  }
}
