"use client";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, ExternalLink, Lightbulb, LayoutDashboard, RefreshCw, Search } from "lucide-react";
import { Badge, Button, Card, Chip, EmptyState, inputCls, Notice, SectionHead, Skeleton, useToast } from "../ui";
import { type TabProps } from "./shared";
import { buildGroups, refContext, type GroupId, type LiveQuery, type Platform, type RefItem, type RefLabel } from "@/lib/references/plan";
import { updateProject } from "@/lib/store";
import { newId } from "@/lib/engine/palette";
import type { Project } from "@/lib/types";

type Filter = "all" | RefLabel;
interface GroupState { key: string; items: RefItem[]; errors: string[] }
const LABEL: Record<RefLabel, { text: string; tone: "ok" | "neutral" | "accent"; hint: string }> = {
  live: { text: "Live result", tone: "ok", hint: "Returned just now by the source's own API for this query." },
  shortcut: { text: "Search shortcut", tone: "neutral", hint: "Opens the site's search for this query. DesignPilot has not seen the results." },
  curated: { text: "Curated", tone: "accent", hint: "A known directory chosen by DesignPilot, not matched to your project by a search." },
};

async function runLive(g: GroupId, lq: LiveQuery, kw: string[]): Promise<{ items: RefItem[]; error?: string; off?: boolean }> {
  try {
    if (lq.kind === "web") {
      const r = await fetch(`/api/references?q=${encodeURIComponent(lq.q)}&kw=${encodeURIComponent(kw.join(","))}`); const j = await r.json();
      if (j.configured === false) return { items: [], off: true };
      if (j.error) return { items: [], error: j.error };
      return { items: (j.results as { title: string; url: string; description: string; host: string; matched: string[]; thumb?: string }[]).slice(0, 6).map((x) => ({ id: `${g}:web:${x.url}`, group: g, title: x.title, url: x.url, source: x.host.replace(/^www\./, ""), label: "live" as const, category: "Web result", thumb: x.thumb, description: x.description, why: x.matched.length ? `Matched your terms: ${x.matched.join(", ")}.` : "Returned for the search above; no exact keyword match." })) };
    }
    if (lq.kind === "apps") {
      const j = await (await fetch(`/api/references/apps?q=${encodeURIComponent(lq.q)}`)).json();
      if (j.error) return { items: [], error: j.error };
      return { items: (j.results as { title: string; url: string; thumb?: string; genre: string; seller: string; description: string }[]).slice(0, 6).map((x) => ({ id: `${g}:app:${x.url}`, group: g, title: x.title, url: x.url, source: "App Store", label: "live" as const, category: x.genre || "App", thumb: x.thumb, description: x.description, why: `App Store result for “${lq.q}”${x.seller ? ` by ${x.seller}` : ""}. Related by search, not confirmed as a competitor.` })) };
    }
    const j = await (await fetch(`/api/references/repos?q=${encodeURIComponent(lq.q)}`)).json();
    if (j.error) return { items: [], error: j.error };
    return { items: (j.results as { title: string; url: string; description: string; stars: number; language: string; license: string }[]).slice(0, 6).map((x) => ({ id: `${g}:repo:${x.url}`, group: g, title: x.title, url: x.url, source: "GitHub", label: "live" as const, category: "Open source", description: x.description, why: `${x.stars.toLocaleString()} stars${x.language ? ` · ${x.language}` : ""}${x.license ? ` · ${x.license} licence` : " · check the licence before reuse"}.` })) };
  } catch { return { items: [], error: "Couldn't reach the search service." }; }
}

function Thumb({ src, onError }: { src: string; onError: () => void }) {
  // Remote thumbnails come straight from the source's API, so next/image optimisation is deliberately not used.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={onError} className="h-36 w-full border-b border-line bg-elevated object-cover object-top" />;
}

function Card1({ p, r, boards, onSave, onBoard, onIdea }: { p: Project; r: RefItem; boards: Project["moodboards"]; onSave: () => void; onBoard: (id: string) => void; onIdea: () => void }) {
  const saved = p.bookmarks.some((b) => b.kind === "reference" && b.url === r.url);
  const [bad, setBad] = useState(false);
  const [pick, setPick] = useState(boards[0]?.id ?? "new");
  const L = LABEL[r.label];
  return (
    <Card className="flex min-w-0 flex-col overflow-hidden p-0">
      {r.thumb && !bad && <Thumb src={r.thumb} onError={() => setBad(true)} />}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-1.5"><span title={L.hint}><Badge tone={L.tone}>{L.text}</Badge></span><Badge>{r.category}</Badge></div>
        <h4 className="mt-2 break-words text-sm font-medium">{r.title}</h4>
        <p className="truncate text-[11px] text-faint">{r.source}</p>
        {r.description && <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{r.description}</p>}
        <p className="mt-1.5 text-xs leading-relaxed text-faint"><span className="text-muted">Why it&rsquo;s here:</span> {r.why}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-elevated px-3 text-xs hover:bg-hover"><ExternalLink size={13} aria-hidden />Open<span className="sr-only"> {r.title} in a new tab</span></a>
          <button type="button" onClick={onSave} aria-pressed={saved} className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs hover:bg-hover ${saved ? "bg-accent-soft text-accent" : "bg-elevated"}`}><Bookmark size={13} fill={saved ? "currentColor" : "none"} aria-hidden />{saved ? "Saved" : "Save"}<span className="sr-only"> {r.title}</span></button>
          <button type="button" onClick={onIdea} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-elevated px-3 text-xs hover:bg-hover" title="Add to Brainstorming → Visual ideas"><Lightbulb size={13} aria-hidden />Idea<span className="sr-only"> from {r.title}</span></button>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <select aria-label="Moodboard to add to" value={pick} onChange={(e) => setPick(e.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border border-line bg-elevated px-2 text-xs text-fg">{boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}<option value="new">New moodboard</option></select>
          <button type="button" onClick={() => onBoard(pick)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-elevated px-3 text-xs hover:bg-hover"><LayoutDashboard size={13} aria-hidden />Add<span className="sr-only"> {r.title} to moodboard</span></button>
        </div>
      </div>
    </Card>
  );
}

export function SimilarTab({ project: p, direction: d }: TabProps) {
  const toast = useToast();
  const ctx = useMemo(() => refContext(p, d), [p, d]);
  const [prefill] = useState(() => { try { const q = sessionStorage.getItem("dp:refquery") ?? ""; if (q) sessionStorage.removeItem("dp:refquery"); return q; } catch { return ""; } });
  const [extra, setExtra] = useState(prefill);
  const [draft, setDraft] = useState(prefill);
  const [platform, setPlatform] = useState<Platform>(ctx.platform);
  const [filter, setFilter] = useState<Filter>("all");
  const [state, setState] = useState<Partial<Record<GroupId, GroupState>>>({});
  const [braveOff, setBraveOff] = useState(false);
  const groups = useMemo(() => buildGroups(ctx, extra, platform), [ctx, extra, platform]);
  const kw = useMemo(() => [...ctx.style, ctx.subject, ...ctx.features, ...extra.split(/\s+/)].map((s) => s.toLowerCase()).filter(Boolean).slice(0, 10), [ctx, extra]);

  const [nonce, setNonce] = useState(0);
  const key = useMemo(() => JSON.stringify(groups.map((g) => g.live)) + "#" + nonce, [groups, nonce]);
  useEffect(() => {
    let live = true;
    groups.forEach(async (g) => {
      const res = await Promise.all(g.live.map((lq) => runLive(g.id, lq, kw)));
      if (!live) return;
      if (res.some((r) => r.off)) setBraveOff(true);
      setState((s) => ({ ...s, [g.id]: { key, items: res.flatMap((r) => r.items), errors: res.map((r) => r.error).filter((x): x is string => !!x) } }));
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const loadingOf = (g: { id: GroupId; live: LiveQuery[] }) => g.live.length > 0 && state[g.id]?.key !== key;

  const save = (r: RefItem) => updateProject(p.id, (x) => {
    const has = x.bookmarks.some((b) => b.kind === "reference" && b.url === r.url);
    x.bookmarks = has ? x.bookmarks.filter((b) => !(b.kind === "reference" && b.url === r.url)) : [{ id: newId("bm"), at: Date.now(), kind: "reference", title: r.title, url: r.url, source: r.source, thumb: r.thumb, category: r.category, refLabel: r.label, group: r.group }, ...x.bookmarks];
  }, `Reference ${p.bookmarks.some((b) => b.url === r.url) ? "removed" : "saved"}: ${r.title}`);
  const toBoard = (r: RefItem, boardId: string) => {
    updateProject(p.id, (x) => {
      let b = x.moodboards.find((m) => m.id === boardId);
      if (!b) { b = { id: newId("mb"), name: "Similar references", directionId: x.selectedDirection ?? x.directions[0].id, items: [], updatedAt: 0 }; x.moodboards.unshift(b); }
      if (!b.items.some((i) => i.type === "link" && i.url === r.url)) b.items.push({ id: newId("mi"), type: "link", title: r.title, url: r.url, source: r.source });
      b.updatedAt = Date.now();
    }, `Added ${r.title} to a moodboard`);
    toast(`Added “${r.title}” to a moodboard`);
  };
  const toIdea = (r: RefItem) => {
    updateProject(p.id, (x) => { x.brainstorm ??= { ideas: [], tasks: [], requirements: [] }; x.brainstorm.ideas.unshift({ id: newId("idea"), group: "Visual ideas", text: `Study “${r.title}” (${r.source}): ${r.why}`, status: "research", origin: "you", createdAt: Date.now() }); }, `Idea from ${r.title}`);
    toast("Added to Brainstorming → Visual ideas");
  };

  const shown = (g: { id: GroupId; shortcuts: RefItem[] }) => {
    const st = state[g.id]?.key === key ? state[g.id] : undefined; const all = [...(st?.items ?? []), ...g.shortcuts];
    return filter === "all" ? all : all.filter((r) => r.label === filter);
  };
  const busy = groups.some(loadingOf);
  const pills = [ctx.type, ctx.subject, ctx.audience && `for ${ctx.audience}`, platform !== "any" && platform, ...ctx.style, ...ctx.flows].filter(Boolean) as string[];

  return (
    <div className="rise">
      <SectionHead title="Similar references" desc="Real references related to your project, grouped by what they help you decide. Each item says where it came from: a live result from the source, a search shortcut, or a curated directory. Nothing is invented." right={<Button size="sm" onClick={() => setNonce((n) => n + 1)} disabled={busy}><RefreshCw size={14} className={busy ? "animate-spin" : ""} aria-hidden />Refresh</Button>} />
      <Card className="p-4">
        <p className="mb-2 text-xs font-medium text-muted">Searches are built from{p.selectedDirection && d ? ` your “${d.name}” direction and` : ""} your brief</p>
        <div className="flex flex-wrap gap-1.5">{pills.map((x, i) => <Badge key={x + i}>{x}</Badge>)}</div>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setExtra(draft.trim()); }}>
          <label className="sr-only" htmlFor="ref-extra">Refine searches</label>
          <input id="ref-extra" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Refine: add words like “subscription”, “dark mode”, “checkout”…" className={`${inputCls} min-w-0 flex-1`} />
          <Button type="submit" variant="primary"><Search size={15} aria-hidden />Refine</Button>
          {extra && <Button type="button" onClick={() => { setExtra(""); setDraft(""); }}>Clear</Button>}
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2" >
          <div role="group" aria-label="Platform" className="flex flex-wrap items-center gap-1.5"><span className="text-xs text-faint">Platform</span>{(["any", "web", "mobile"] as Platform[]).map((x) => <Chip key={x} active={platform === x} onClick={() => setPlatform(x)}>{x === "any" ? "Any" : x === "web" ? "Web" : "Mobile"}</Chip>)}</div>
          <div role="group" aria-label="Source type" className="flex flex-wrap items-center gap-1.5"><span className="text-xs text-faint">Show</span>{(["all", "live", "shortcut", "curated"] as Filter[]).map((x) => <Chip key={x} active={filter === x} onClick={() => setFilter(x)}>{x === "all" ? "Everything" : x === "live" ? "Live results" : x === "shortcut" ? "Search shortcuts" : "Curated sources"}</Chip>)}</div>
        </div>
      </Card>
      {braveOff && <div className="mt-3"><Notice>Web search results are off: no <code className="rounded bg-elevated px-1">BRAVE_SEARCH_API_KEY</code> is set on the server. App Store and GitHub results and the search shortcuts still work.</Notice></div>}
      <p className="mt-3 text-xs text-faint">Results keep the order each source returns them. There is no sort option because no source gives a score that would be honest to sort by, and no &ldquo;load more&rdquo; because each source is asked for one page.</p>

      {groups.map((g) => {
        const st = state[g.id]?.key === key ? state[g.id] : undefined; const loading = loadingOf(g); const items = shown(g);
        return (
          <section key={g.id} className="mt-8" aria-labelledby={`g-${g.id}`}>
            <h3 id={`g-${g.id}`} className="text-base font-semibold">{g.label}</h3>
            <p className="mb-3 mt-0.5 text-[13px] text-muted">{g.desc}</p>
            {st?.errors.map((er, i) => <div key={i} className="mb-3"><Notice tone="warn">{er}</Notice></div>)}
            {loading && <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={`Loading ${g.label}`}><Skeleton className="h-40" /><Skeleton className="hidden h-40 sm:block" /><Skeleton className="hidden h-40 xl:block" /></div>}
            {items.length === 0 && !loading ? <EmptyState title="Nothing in this view">{filter === "live" ? "No live results came back for this group (the source may be switched off or have nothing for this query)." : "Try another filter."}</EmptyState> :
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((r) => <Card1 key={r.id} p={p} r={r} boards={p.moodboards} onSave={() => save(r)} onBoard={(id) => toBoard(r, id)} onIdea={() => toIdea(r)} />)}</div>}
          </section>
        );
      })}
      <p className="mt-8 text-xs text-faint">Thumbnails appear only when the source&rsquo;s API returns one (App Store, and web results when the search provider includes one). Search shortcuts never show previews. Respect each source&rsquo;s terms and the original creators&rsquo; rights.</p>
    </div>
  );
}
