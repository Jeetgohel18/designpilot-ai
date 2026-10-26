import { assertPublicHttps } from "@/lib/server/ssrf";
import { rateLimit, tooMany } from "@/lib/server/ratelimit";

// Checks that a link responds. Only public https hosts are allowed (SSRF protection); redirects are followed manually and re-checked.
export async function GET(req: Request) {
  const rl = rateLimit(req, "verify", 20);
  if (!rl.ok) return tooMany(rl.retryAfter);
  let url = new URL(req.url).searchParams.get("url") ?? "";
  try {
    for (let hop = 0; hop < 4; hop++) {
      const u = await assertPublicHttps(url);
      const res = await fetch(u, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(6000), headers: { "User-Agent": "DesignPilotLinkCheck/1.0" } });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) { url = new URL(res.headers.get("location")!, u).toString(); continue; }
      // Some sites reject HEAD (405/403) but are alive; report that honestly.
      return Response.json({ checked: true, status: res.status, ok: res.ok, finalUrl: u.toString(), note: res.ok ? "Responded OK" : res.status === 405 || res.status === 403 ? "Server blocks automated checks — open it manually" : `HTTP ${res.status}` });
    }
    return Response.json({ checked: true, ok: false, note: "Too many redirects" });
  } catch (e) {
    return Response.json({ checked: false, ok: false, note: e instanceof Error ? e.message : "Could not verify" });
  }
}
