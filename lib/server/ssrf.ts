import { lookup } from "node:dns/promises";
import net from "node:net";

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
}

/** Throws unless the URL is public https. Used by the link verifier to avoid SSRF. */
export async function assertPublicHttps(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== "https:") throw new Error("Only https links can be verified");
  if (u.username || u.password) throw new Error("Credentials in URL are not allowed");
  if (u.port && u.port !== "443") throw new Error("Non-standard ports are not allowed");
  if (net.isIP(u.hostname)) throw new Error("IP addresses are not allowed");
  const addrs = await lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("Host is not publicly routable");
  return u;
}
