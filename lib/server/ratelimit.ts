// Simple in-memory sliding-window limiter. Fine for one server instance; on serverless/multi-instance
// hosting swap for Upstash/Redis (see README).
const buckets = new Map<string, number[]>();

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export function rateLimit(req: Request, name: string, max: number, windowMs = 60_000): { ok: true } | { ok: false; retryAfter: number } {
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  return { ok: true };
}

export const tooMany = (retryAfter: number) =>
  Response.json({ error: `Too many requests. Try again in ${retryAfter}s.` }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
