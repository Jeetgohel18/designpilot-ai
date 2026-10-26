"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Chip, inputCls, Notice, SectionHead, SourceBadge, useCopy } from "../ui";
import { competitorSearchLinks, referenceSearchLinks, type SourceLink } from "@/lib/engine/resources";
import { INDUSTRIES } from "@/lib/engine/taxonomy";
import { BookmarkButton, searchKeywords, type TabProps } from "./shared";
import type { Project } from "@/lib/types";

const TYPES: [string, string][] = [["All", ""], ["Websites", "website design"], ["Landing pages", "landing page design"], ["Mobile apps", "mobile app UI"], ["SaaS products", "SaaS product UI"], ["E-commerce", "e-commerce store design"], ["Case studies", "design case study"]];
const PLATFORMS: [string, string][] = [["Any platform", ""], ["Desktop web", "desktop"], ["Mobile", "mobile"]];

type Live = { forQuery?: string; configured: boolean; reason?: string; error?: string; results?: { title: string; url: string; description: string; host: string; matched: string[]; score: number; scoreMethod: string; age: string | null }[] };

function LinkCard({ p, l, q, why }: { p: Project; l: SourceLink; q: string; why: string }) {
  const copy = useCopy();
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: l.name, url: l.url }); return; } catch (e) { if ((e as Error).name === "AbortError") return; } }
    copy(l.url, "Link");
  }
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2"><div><h4 className="text-sm font-medium">{l.name}</h4><div className="mt-1"><SourceBadge kind={l.kind === "search" ? "search" : "curated"} /></div></div><BookmarkButton p={p} b={{ kind: "reference", title: `${l.name}: ${q}`, url: l.url, source: l.name }} /></div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{l.note}</p>
      <p className="mt-2 text-xs leading-relaxed text-faint"><span className="text-muted">Why here:</span> {why}</p>
      <div className="mt-auto flex gap-1.5 pt-3">
        <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 flex-1 items-center justify-center rounded-lg bg-elevated px-2.5 text-xs hover:bg-hover">Open original ↗</a>
        <Button size="sm" variant="ghost" onClick={share} aria-label={`Share ${l.name}`}>Share</Button>
      </div>
    </Card>
  );
}

export function ReferencesTab({ project: p, direction: d }: TabProps) {
  const copy = useCopy();
  const [kw, setKw] = useState<string[]>(() => searchKeywords(p, d));
  const [draft, setDraft] = useState("");
  const [type, setType] = useState(0);
  const [plat, setPlat] = useState(0);
  const [live, setLive] = useState<Live | null>(null);
  const [verified, setVerified] = useState<Record<string, string>>({});

  const industry = INDUSTRIES.find((i) => i.label === p.profile.industry);
  const q = useMemo(() => [...kw.slice(0, 4), TYPES[type][1], PLATFORMS[plat][1]].filter(Boolean).join(" "), [kw, type, plat]);

  const kwKey = kw.join(",");
  useEffect(() => {
    let off = false;
    fetch(`/api/references?q=${encodeURIComponent(q)}&kw=${encodeURIComponent(kwKey)}`).then((r) => r.json())
      .then((d) => { if (!off) setLive({ ...d, forQuery: q }); })
      .catch(() => { if (!off) setLive({ configured: true, error: "Couldn't reach the search endpoint.", forQuery: q }); });
    return () => { off = true; };
  }, [q, kwKey]);
  const loading = !live || live.forQuery !== q;

  async function verify(url: string) {
    setVerified((v) => ({ ...v, [url]: "Checking…" }));
    try { const r = await (await fetch(`/api/verify?url=${encodeURIComponent(url)}`)).json(); setVerified((v) => ({ ...v, [url]: r.checked ? `${r.ok ? "✓" : "⚠"} ${r.note}` : `Couldn't verify: ${r.note}` })); }
    catch { setVerified((v) => ({ ...v, [url]: "Couldn't verify" })); }
  }

  const sources = referenceSearchLinks(q);
  const competitors = competitorSearchLinks(industry?.searchTerms ?? [q]);
  const saved = p.bookmarks.filter((b) => b.kind === "reference");

  return (
    <div className="rise">
      <SectionHead title="References & competitors" desc="Inspiration and competitor research, built from your project's keywords and selected direction. Nothing here is invented: results come from live search (when configured) or from the sources' own search pages." />

      <Card className="p-4">
        <p className="mb-2 text-xs font-medium text-muted">Search keywords{d ? ` · refined by “${d.name}”` : ""}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {kw.map((k) => <button key={k} onClick={() => setKw(kw.filter((x) => x !== k))} className="group inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-red-400/40 hover:text-red-200" aria-label={`Remove keyword ${k}`}>{k}<span className="opacity-50 group-hover:opacity-100">✕</span></button>)}
          <form onSubmit={(e) => { e.preventDefault(); const v = draft.trim().toLowerCase(); if (v && !kw.includes(v)) setKw([...kw, v]); setDraft(""); }}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add keyword ↵" aria-label="Add keyword" className={`${inputCls} !w-36 !py-1 text-xs`} /></form>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-faint">Resource type</span>{TYPES.map(([l], i) => <Chip key={l} active={type === i} onClick={() => setType(i)}>{l}</Chip>)}
          <span className="ml-2 text-xs text-faint">Platform</span>{PLATFORMS.map(([l], i) => <Chip key={l} active={plat === i} onClick={() => setPlat(i)}>{l}</Chip>)}
        </div>
        <p className="mt-3 font-mono text-xs text-faint">Query: <span className="text-muted">{q}</span> <button className="ml-2 text-accent hover:underline" onClick={() => copy(q, "Query")}>copy</button></p>
      </Card>

      <h3 className="mt-8 mb-3 flex items-center gap-2 text-base font-semibold">Live web results {!loading && live?.configured && !live.error && <SourceBadge kind="live" />}</h3>
      {loading && <div className="skeleton h-24 rounded-xl" />}
      {!loading && live && !live.configured && <Notice>Live web results are off. {live.reason} Add a free <code className="rounded bg-elevated px-1">BRAVE_SEARCH_API_KEY</code> to see real, ranked results here (setup steps are in the README). The source links below work without any key.</Notice>}
      {!loading && live?.error && <Notice tone="warn">{live.error}</Notice>}
      {!loading && live?.results && (
        <>
          <p className="mb-3 text-xs text-faint">Relevance = share of your keywords found in the title, description or URL (plus a small bonus for known design sites). The exact calculation is shown on every result.</p>
          <div className="space-y-2.5">{live.results.map((r) => (
            <Card key={r.url} className="p-4"><div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-accent">{r.title} ↗</a><p className="truncate text-xs text-faint">{r.host}{r.age ? ` · ${r.age}` : ""}</p><p className="mt-1.5 text-[13px] leading-relaxed text-muted">{r.description.replace(/<[^>]+>/g, "")}</p>
                <p className="mt-2 text-xs text-faint"><span className="text-muted">Why it matches:</span> {r.matched.length ? `mentions ${r.matched.join(", ")}` : "broad match to your query"} · <span title={r.scoreMethod}>score {r.score.toFixed(2)} ({r.scoreMethod})</span></p>
                {verified[r.url] && <p className="mt-1 text-xs text-muted">{verified[r.url]}</p>}</div>
              <div className="flex shrink-0 items-center gap-1"><Button size="sm" variant="ghost" onClick={() => verify(r.url)}>Verify link</Button><BookmarkButton p={p} b={{ kind: "reference", title: r.title, url: r.url, source: r.host }} /></div>
            </div></Card>
          ))}</div>
        </>
      )}

      <h3 className="mt-10 mb-1 text-base font-semibold">Design inspiration sources</h3>
      <p className="mb-3 text-xs text-faint">Opens each source&rsquo;s own results for your query. Order is fixed — no ranking is applied to search links, and results are not verified by DesignPilot.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{sources.map((l) => <LinkCard key={l.name} p={p} l={l} q={q} why={l.kind === "search" ? `Searches ${l.name} for “${q}”.` : `Browse ${l.name} for ${p.profile.industry.toLowerCase()} examples.`} />)}</div>

      <h3 className="mt-10 mb-1 text-base font-semibold">Competitor research</h3>
      <p className="mb-3 text-xs text-faint">DesignPilot doesn&rsquo;t list specific competitors without a verified source. These searches help you build your own competitive set.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{competitors.map((l) => <LinkCard key={l.name} p={p} l={l} q={industry?.searchTerms[0] ?? q} why={`Uses the industry term “${industry?.searchTerms[0] ?? q}”.`} />)}</div>

      <div className="mt-10 mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Saved references ({saved.length})</h3></div>
      {saved.length === 0 ? <p className="text-sm text-faint">Bookmark any card to keep it here.</p> : <ul className="space-y-1.5">{saved.map((b) => <li key={b.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"><a href={b.url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-accent">{b.title} ↗</a><div className="flex items-center gap-2"><Badge>{b.source}</Badge><BookmarkButton p={p} b={{ kind: "reference", title: b.title, url: b.url }} /></div></li>)}</ul>}
    </div>
  );
}
