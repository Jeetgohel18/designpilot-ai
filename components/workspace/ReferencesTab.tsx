"use client";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, ShieldCheck, Share2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, inputCls, Notice, SectionHead, Skeleton, SourceBadge, useCopy } from "../ui";
import { researchCategories, type ResearchLink } from "@/lib/engine/resources";
import { INDUSTRIES } from "@/lib/engine/taxonomy";
import { BookmarkButton, searchKeywords, type TabProps } from "./shared";
import type { Project } from "@/lib/types";

type LiveResult = { title: string; url: string; description: string; host: string; matched: string[]; score: number; scoreMethod: string; age: string | null };
type Live = { forQuery?: string; configured: boolean; reason?: string; error?: string; results?: LiveResult[] };

function LinkCard({ p, l, category }: { p: Project; l: ResearchLink; category: string }) {
  const copy = useCopy();
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: l.name, url: l.url }); return; } catch (e) { if ((e as Error).name === "AbortError") return; } }
    copy(l.url, "Link");
  }
  let host = ""; try { host = new URL(l.url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
  return (
    <Card className="flex min-w-0 flex-col p-4">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="text-sm font-medium">{l.name}</h4><p className="truncate text-[11px] text-faint">{host}</p></div><BookmarkButton p={p} b={{ kind: "reference", title: l.name, url: l.url, source: category }} /></div>
      <div className="mt-2 flex flex-wrap gap-1.5"><SourceBadge kind={l.kind === "search" ? "search" : "curated"} /><Badge>{category}</Badge></div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{l.note}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-faint"><span className="text-muted">Why here:</span> {l.why}</p>
      <div className="mt-auto flex gap-1.5 pt-3"><a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-elevated px-2.5 text-xs hover:bg-hover sm:min-h-7"><ExternalLink size={13} aria-hidden />Open</a><Button size="sm" variant="ghost" onClick={share} aria-label={`Share ${l.name}`}><Share2 size={13} aria-hidden /></Button></div>
    </Card>
  );
}

export function ReferencesTab({ project: p, direction: d }: TabProps) {
  const copy = useCopy();
  const [kw, setKw] = useState<string[]>(() => searchKeywords(p, d));
  const [draft, setDraft] = useState("");
  const [cat, setCat] = useState("competitors");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState<Record<string, string>>({});

  const industry = INDUSTRIES.find((i) => i.label === p.profile.industry);
  const cats = useMemo(() => researchCategories({ industry: p.profile.industry, niche: p.profile.niche, projectType: p.profile.projectType, audience: p.profile.audience, keywords: kw, mood: p.profile.visualMood, direction: p.selectedDirection ? d?.name : undefined, fonts: d ? [d.fonts.heading, d.fonts.body] : [], brands: d?.brandReferences, searchTerms: industry?.searchTerms ?? [] }), [p, kw, d, industry]);
  const current = cats.find((c) => c.id === cat) ?? cats[0];

  useEffect(() => { let off = false; fetch("/api/references?status=1").then((r) => r.json()).then((j) => { if (!off) setConfigured(!!j.configured); }).catch(() => { if (!off) setConfigured(false); }); return () => { off = true; }; }, []);

  async function search() {
    setBusy(true); setLive(null);
    const q = current.liveQuery;
    try { const j = await (await fetch(`/api/references?q=${encodeURIComponent(q)}&kw=${encodeURIComponent(kw.join(","))}`)).json(); setLive({ ...j, forQuery: q }); }
    catch { setLive({ configured: true, error: "Couldn't reach the search service. Try again in a moment.", forQuery: q }); }
    finally { setBusy(false); }
  }
  async function verify(url: string) {
    setVerified((v) => ({ ...v, [url]: "Checking…" }));
    try { const r = await (await fetch(`/api/verify?url=${encodeURIComponent(url)}`)).json(); setVerified((v) => ({ ...v, [url]: r.checked ? `${r.ok ? "✓" : "⚠"} ${r.note}` : `Couldn't verify: ${r.note}` })); }
    catch { setVerified((v) => ({ ...v, [url]: "Couldn't verify" })); }
  }
  const saved = p.bookmarks.filter((b) => b.kind === "reference");

  return (
    <div className="rise">
      <SectionHead title="Inspiration & research" desc="Eight kinds of research, built from your brief and chosen direction. Links open each source's own results; nothing here is invented or verified by DesignPilot unless it says so." />

      <Card className="p-4">
        <p className="mb-2 text-xs font-medium text-muted">Search keywords{p.selectedDirection && d ? ` · refined by “${d.name}”` : ""}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {kw.map((k) => <button key={k} onClick={() => setKw(kw.filter((x) => x !== k))} className="group inline-flex min-h-8 items-center gap-1 rounded-full border border-line px-2.5 text-xs text-muted hover:border-red-400/40 hover:text-red-200" aria-label={`Remove keyword ${k}`}>{k}<span className="opacity-50 group-hover:opacity-100" aria-hidden>✕</span></button>)}
          <form onSubmit={(e) => { e.preventDefault(); const v = draft.trim().toLowerCase(); if (v && !kw.includes(v)) setKw([...kw, v]); setDraft(""); }}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add keyword ↵" aria-label="Add keyword" className={`${inputCls} !w-36 !py-1 text-xs`} /></form>
        </div>
        <p className="mt-2 text-xs text-faint">Be specific: “skincare” beats “website”. Remove words that are too generic.</p>
      </Card>

      <div className="scroll-thin mt-5 flex gap-1.5 overflow-x-auto pb-2" role="tablist" aria-label="Research categories">
        {cats.map((c) => <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => { setCat(c.id); setLive(null); }} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${cat === c.id ? "border-accent/50 bg-accent-soft text-[#cfc9ff]" : "border-line text-muted hover:border-line-strong hover:text-fg"}`}>{c.label}</button>)}
      </div>
      <p className="mb-4 mt-1 text-[13px] text-muted">{current.desc}</p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{current.links.map((l) => <LinkCard key={l.url + l.name} p={p} l={l} category={current.label} />)}</div>
      <p className="mt-2 text-xs text-faint">Order is fixed. No ranking, screenshots or thumbnails are shown for these links because there is no permitted, reliable source for them here.</p>

      <Card className="mt-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="flex items-center gap-2 text-sm font-semibold">Live web search <SourceBadge kind="live" /></h3><p className="mt-0.5 text-[13px] text-muted">Searches for: <span className="font-mono text-xs text-fg">{current.liveQuery}</span></p></div>
          <div className="flex gap-2"><Button variant="primary" onClick={search} disabled={busy || configured === false}><Search size={15} aria-hidden />{busy ? "Searching…" : "Search the web"}</Button><Button size="sm" variant="ghost" onClick={() => copy(current.liveQuery, "Query")}>Copy query</Button></div>
        </div>
        {configured === false && <div className="mt-3"><Notice>Live results are switched off: no <code className="rounded bg-elevated px-1">BRAVE_SEARCH_API_KEY</code> is configured on the server. The curated links above work without it.</Notice></div>}
        {busy && <div className="mt-4 space-y-2" role="status" aria-label="Searching"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}
        {live?.error && <div className="mt-4"><Notice tone="warn">{live.error}</Notice></div>}
        {live?.results && live.results.length === 0 && <div className="mt-4"><EmptyState title="No results">Try removing a keyword or searching a different category.</EmptyState></div>}
        {live?.results && live.results.length > 0 && (
          <div className="mt-4">
            <p className="mb-3 text-xs text-faint">Relevance = share of your keywords found in the title, description or URL (plus a small bonus for known design sites). The calculation is shown on each result. These are search results, not endorsements.</p>
            <div className="space-y-2.5">{live.results.map((r) => (
              <div key={r.url} className="rounded-lg border border-line p-3"><div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><a href={r.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm font-medium hover:text-accent">{r.title} ↗</a><p className="truncate text-xs text-faint">{r.host}{r.age ? ` · ${r.age}` : ""}</p><p className="mt-1.5 text-[13px] leading-relaxed text-muted">{r.description.replace(/<[^>]+>/g, "")}</p>
                  <p className="mt-2 text-xs text-faint"><span className="text-muted">Why it matches:</span> {r.matched.length ? `mentions ${r.matched.join(", ")}` : "broad match to the query"} · score {r.score.toFixed(2)} ({r.scoreMethod})</p>
                  {verified[r.url] && <p className="mt-1 flex items-center gap-1 text-xs text-muted"><ShieldCheck size={12} aria-hidden />{verified[r.url]}</p>}</div>
                <div className="flex shrink-0 items-center gap-1"><Button size="sm" variant="ghost" onClick={() => verify(r.url)}>Verify link</Button><BookmarkButton p={p} b={{ kind: "reference", title: r.title, url: r.url, source: r.host }} /></div>
              </div></div>))}</div>
          </div>
        )}
      </Card>

      <h3 className="mb-3 mt-8 text-base font-semibold">Saved references <span className="font-normal text-faint">({saved.length})</span></h3>
      {saved.length === 0 ? <EmptyState title="Nothing saved yet">Bookmark any card above to keep it here and in your research export.</EmptyState> : <ul className="space-y-1.5">{saved.map((b) => <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm"><a href={b.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate hover:text-accent">{b.title} ↗</a><div className="flex shrink-0 items-center gap-2"><Badge>{b.source}</Badge><BookmarkButton p={p} b={{ kind: "reference", title: b.title, url: b.url }} /></div></li>)}</ul>}
    </div>
  );
}
