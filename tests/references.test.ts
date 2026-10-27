import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGroups, GROUP_IDS, refContext } from "../lib/references/plan";
import { GET as apps } from "../app/api/references/apps/route";
import { GET as repos } from "../app/api/references/repos/route";
import { GET as web } from "../app/api/references/route";
import { makeProject } from "./fixtures";

const p = makeProject("I want to build a premium skincare e-commerce website targeting Gen Z, with a luxurious minimal aesthetic, organic ingredients");
const mobileP = makeProject("A mobile app for tracking daily habits for busy students with a playful feel");

describe("reference plan", () => {
  it("has the six groups and project-specific queries (not generic)", () => {
    const g = buildGroups(refContext(p, p.directions[0]));
    expect(g.map((x) => x.id)).toEqual(GROUP_IDS);
    for (const grp of g) {
      const qs = grp.live.map((l) => l.q.toLowerCase()).concat(grp.shortcuts.map((s) => decodeURIComponent(s.url).toLowerCase()));
      expect(qs.some((q) => /skincare|beauty/.test(q)), grp.id).toBe(true);
    }
    const all = JSON.stringify(g).toLowerCase();
    expect(all).not.toMatch(/\b(best website design)\b/);
  });
  it("platform changes queries and sources; extra words refine without dropping context", () => {
    const m = buildGroups(refContext(mobileP), "streaks", "mobile");
    expect(m.find((x) => x.id === "products")!.live.some((l) => l.kind === "apps" && /streaks/.test(l.q))).toBe(true);
    const w = buildGroups(refContext(p), "", "web");
    expect(w.find((x) => x.id === "products")!.live.some((l) => l.kind === "apps")).toBe(false);
  });
  it("never labels shortcuts as live and never calls items competitors", () => {
    const g = buildGroups(refContext(p, p.directions[0]));
    const items = g.flatMap((x) => x.shortcuts);
    expect(items.every((i) => i.label !== "live")).toBe(true);
    expect(items.filter((i) => i.label === "curated").length).toBeGreaterThan(0);
    expect(JSON.stringify(g)).not.toMatch(/competitor:/i);
    expect(g.find((x) => x.id === "products")!.label).toBe("Related products");
    for (const i of items) expect(() => new URL(i.url)).not.toThrow();
  });
});

const req = (path: string, q: string) => new Request(`http://x${path}?q=${encodeURIComponent(q)}`, { headers: { "x-forwarded-for": Math.random().toString() } });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("reference routes (fetch stubbed — live hosts are not reachable from CI)", () => {
  it("apps: maps iTunes payload, https only, no tracking junk", async () => {
    vi.stubGlobal("fetch", vi.fn(async (u: string) => { expect(u).toContain("itunes.apple.com/search"); return Response.json({ results: [
      { trackName: "Habit", trackViewUrl: "https://apps.apple.com/us/app/x/id1", screenshotUrls: ["https://is1.mzstatic.com/a.jpg"], primaryGenreName: "Health", sellerName: "Acme", description: "d  d" },
      { trackName: "Bad", trackViewUrl: "http://insecure/x" }] }); }));
    const j = await (await apps(req("/api/references/apps", "habit"))).json();
    expect(j.results).toHaveLength(1);
    expect(j.results[0]).toMatchObject({ title: "Habit", thumb: "https://is1.mzstatic.com/a.jpg", genre: "Health" });
  });
  it("apps: reports upstream failure and rate limits without raw errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 429 })));
    const r = await apps(req("/api/references/apps", "limit"));
    expect(r.status).toBe(429);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("secret detail"); }));
    const r2 = await apps(req("/api/references/apps", "boom"));
    expect(r2.status).toBe(502); expect(JSON.stringify(await r2.json())).not.toContain("secret");
  });
  it("repos: maps GitHub payload and handles the 403 rate limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ items: [{ full_name: "a/b", html_url: "https://github.com/a/b", description: null, stargazers_count: 1200, language: "TypeScript", license: { spdx_id: "MIT" } }, { full_name: "x/y", html_url: "https://evil.example/x", description: "", stargazers_count: 1, language: null }] })));
    const j = await (await repos(req("/api/references/repos", "design system"))).json();
    expect(j.results).toEqual([{ title: "a/b", url: "https://github.com/a/b", description: "", stars: 1200, language: "TypeScript", license: "MIT" }]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })));
    expect((await repos(req("/api/references/repos", "other"))).status).toBe(429);
  });
  it("web: includes https thumbnails only and keeps the old shape", async () => {
    vi.stubEnv("BRAVE_SEARCH_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ web: { results: [
      { title: "A skincare site", url: "https://dribbble.com/shots/1", description: "skincare", meta_url: { hostname: "dribbble.com" }, thumbnail: { src: "https://imgs.search.brave.com/t.jpg" } },
      { title: "B", url: "https://example.com/b", thumbnail: { src: "http://insecure/t.jpg" } }] } })));
    const r = await web(new Request("http://x/api/references?q=skincare%20design&kw=skincare", { headers: { "x-forwarded-for": "9.9.9.9" } }));
    const j = await r.json();
    expect(j.configured).toBe(true);
    expect(j.results[0].thumb).toBe("https://imgs.search.brave.com/t.jpg");
    expect(j.results.find((x: { url: string }) => x.url.includes("example")).thumb).toBeUndefined();
    expect(j.results[0]).toHaveProperty("matched");
  });
});
