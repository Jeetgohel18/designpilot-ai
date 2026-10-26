"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Chip, Dialog, inputCls } from "../ui";
import { FONTS } from "@/lib/fonts";
import { ICON_LIBRARIES, ILLUSTRATION_SOURCES, TOOLS, UI_RESOURCES } from "@/lib/engine/resources";
import type { Project } from "@/lib/types";

type Cat = "Fonts" | "Directions" | "Icons" | "Illustrations" | "Tools & UI" | "Saved";
interface Item { id: string; cat: Cat; title: string; sub: string; haystack: string; url?: string; tab?: string; source: "curated" | "project" | "saved"; at?: number; fav?: boolean }

export function SearchDialog({ open, onClose, project: p, goto }: { open: boolean; onClose: () => void; project: Project; goto: (t: string) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | "All">("All");
  const [src, setSrc] = useState<"all" | Item["source"]>("all");
  const [sort, setSort] = useState<"relevance" | "recent">("relevance");
  const [fav, setFav] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 30); }, [open]);

  const index = useMemo<Item[]>(() => [
    ...FONTS.map((f): Item => ({ id: "f" + f.name, cat: "Fonts", title: f.name, sub: `${f.category} · ${f.moods.join(", ")}`, haystack: `${f.name} ${f.category} ${f.moods.join(" ")} ${f.industries.join(" ")} ${f.character}`.toLowerCase(), tab: "typography", source: "curated" })),
    ...p.directions.map((d): Item => ({ id: "d" + d.id, cat: "Directions", title: d.name, sub: d.summary.slice(0, 80), haystack: `${d.name} ${d.summary} ${d.fonts.heading} ${d.fonts.body} ${d.principles.join(" ")} ${d.imageStyle}`.toLowerCase(), tab: "directions", source: "project" })),
    ...ICON_LIBRARIES.map((l): Item => ({ id: "i" + l.name, cat: "Icons", title: l.name, sub: `${l.styles.join(", ")} · ${l.license}`, haystack: `${l.name} ${l.note} ${l.styles.join(" ")} icon`.toLowerCase(), url: l.url, source: "curated" })),
    ...ILLUSTRATION_SOURCES.map((l): Item => ({ id: "l" + l.name, cat: "Illustrations", title: l.name, sub: l.styles.join(", "), haystack: `${l.name} ${l.note} ${l.styles.join(" ")} illustration`.toLowerCase(), url: l.url, source: "curated" })),
    ...[...UI_RESOURCES, ...TOOLS].map((l): Item => ({ id: "t" + l.name, cat: "Tools & UI", title: l.name, sub: l.note, haystack: `${l.name} ${l.note}`.toLowerCase(), url: l.url, source: "curated" })),
    ...p.bookmarks.map((b): Item => ({ id: "b" + b.id, cat: "Saved", title: b.title, sub: `${b.kind}${b.source ? " · " + b.source : ""}`, haystack: `${b.title} ${b.kind} ${b.source ?? ""} ${b.url ?? ""}`.toLowerCase(), url: b.url, source: "saved", at: b.at, fav: true })),
  ], [p.directions, p.bookmarks]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return index.map((it) => {
      // Relevance: each query term scores 3 if in the title, 1 if elsewhere; items missing any term are excluded.
      let score = 0, ok = true;
      for (const t of terms) { if (it.title.toLowerCase().includes(t)) score += 3; else if (it.haystack.includes(t)) score += 1; else { ok = false; break; } }
      return { it, score, ok };
    }).filter((r) => r.ok && (cat === "All" || r.it.cat === cat) && (src === "all" || r.it.source === src) && (!fav || r.it.fav))
      .sort((a, b) => sort === "recent" ? (b.it.at ?? 0) - (a.it.at ?? 0) : b.score - a.score || a.it.title.localeCompare(b.it.title)).slice(0, 40);
  }, [index, q, cat, src, sort, fav]);

  function pick(it: Item) { if (it.url) window.open(it.url, "_blank", "noopener,noreferrer"); else if (it.tab) goto(it.tab); onClose(); }

  return (
    <Dialog open={open} onClose={onClose} title="Search this workspace" wide>
      <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fonts, directions, icons, tools, saved items…" aria-label="Search" className={inputCls} />
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(["All", "Fonts", "Directions", "Icons", "Illustrations", "Tools & UI", "Saved"] as const).map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <label>Source <select className="ml-1 rounded border border-line bg-elevated px-1.5 py-1" value={src} onChange={(e) => setSrc(e.target.value as typeof src)}><option value="all">any</option><option value="curated">curated</option><option value="project">this project</option><option value="saved">saved</option></select></label>
        <label>Sort <select className="ml-1 rounded border border-line bg-elevated px-1.5 py-1" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="relevance">relevance</option><option value="recent">recently added (saved only)</option></select></label>
        <Chip active={fav} onClick={() => setFav(!fav)}>★ Favorites</Chip>
      </div>
      <ul className="scroll-thin mt-3 max-h-80 space-y-0.5 overflow-y-auto" aria-label="Results">
        {results.map(({ it, score }) => (
          <li key={it.id}><button onClick={() => pick(it)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-hover">
            <span className="min-w-0"><span className="block truncate text-sm">{it.title}</span><span className="block truncate text-xs text-faint">{it.sub}</span></span>
            <span className="flex shrink-0 items-center gap-1.5"><Badge>{it.cat}</Badge>{it.url ? <span className="text-xs text-faint">↗</span> : null}{q && <span className="font-mono text-[10px] text-faint" title="Title match = 3, other field = 1, summed over query terms">{score}</span>}</span>
          </button></li>
        ))}
        {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Nothing found.</li>}
      </ul>
      <p className="mt-2 text-[11px] text-faint">Scores: each query term = 3 points if in the title, 1 if elsewhere. Searches the curated catalog, this project and your saved items.</p>
    </Dialog>
  );
}
