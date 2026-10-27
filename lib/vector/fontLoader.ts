"use client";
import { fontKey, wrapOpentype, type FontResolver, type GlyphFont } from "./text";

const cache = new Map<string, GlyphFont | null>();
const pending = new Map<string, Promise<GlyphFont | null>>();

/** Fetch + parse a Google font (via our /api/font-file route). Resolves to null if it can't be loaded — callers then keep live text. */
export function loadGlyphFont(family: string, weight = 400): Promise<GlyphFont | null> {
  const key = fontKey(family, weight);
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/api/font-file?family=${encodeURIComponent(family)}&weight=${weight}`);
        if (!res.ok) return null;
        const ot = await import("opentype.js");
        return wrapOpentype(ot.parse(await res.arrayBuffer()) as never);
      } catch { return null; }
    })().then((f) => { cache.set(key, f); pending.delete(key); return f; });
    pending.set(key, p);
  }
  return p;
}

/** Load every (family, weight) pair, then return a synchronous resolver for outlineScene(). */
export async function preloadFonts(pairs: { family: string; weight: number }[]): Promise<FontResolver> {
  await Promise.all(pairs.map((p) => loadGlyphFont(p.family, p.weight)));
  return (family, weight) => cache.get(fontKey(family, weight)) ?? undefined;
}
