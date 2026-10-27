"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Download, Search, Star } from "lucide-react";
import { Badge, Button, Card, Chip, SectionHead, download } from "../ui";
import { LibraryStyles, Stage } from "./Stage";
import { ComponentDetail } from "./ComponentDetail";
import { CATEGORIES, COMPONENTS, buildCtx, componentById, defaultCfg, defaultCustom, type Custom } from "@/lib/library";
import { CATEGORY_LABEL, type Component } from "@/lib/library/types";
import { componentsCssFile } from "@/lib/engine/exports";
import { updateProject } from "@/lib/store";
import { useBrandLogoSvg } from "../brand/useBrand";
import type { Project } from "@/lib/types";
import type { TabProps } from "../workspace/shared";

const haystack = (c: Component) => [c.name, c.desc, CATEGORY_LABEL[c.category], c.tokens.join(" "), c.id].join(" ").toLowerCase();

/** Renders the live preview only once the card scrolls into view, so 58 previews don't render at once. */
function Thumb({ c, project, custom, dirId }: { c: Component; project: Project; custom: Custom; dirId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (seen) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el); return () => io.disconnect();
  }, [seen]);
  const d = project.directions.find((x) => x.id === dirId) ?? project.directions[0];
  const html = useMemo(() => (seen ? c.html(defaultCfg(c), buildCtx(project, d, custom)) : ""), [seen, c, project, d, custom]);
  const ctx = useMemo(() => buildCtx(project, d, custom), [project, d, custom]);
  return (
    <div ref={ref} aria-hidden className="relative h-40 overflow-hidden rounded-t-xl border-b border-line bg-elevated">
      {seen ? <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: 520, transform: "scale(.58)" }}><Stage html={html} ctx={ctx} custom={custom} interactive={false} padded minHeight={0} forceWidth={false} /></div> : <div className="h-full animate-pulse bg-elevated" />}
    </div>
  );
}

export function ComponentLibrary({ project: p, direction: dir0, goto }: TabProps) {
  const [dirId, setDirId] = useState(dir0?.id ?? p.directions[0].id);
  const d = p.directions.find((x) => x.id === dirId) ?? p.directions[0];
  const [custom, setCustom] = useState<Custom>(() => defaultCustom(d));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | "favorites" | "recent" | (typeof CATEGORIES)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const fav = p.library?.favorites ?? [];
  const recent = p.library?.recent ?? [];
  const pickDirection = (id: string) => { const nd = p.directions.find((x) => x.id === id); if (!nd) return; setDirId(id); setCustom(defaultCustom(nd)); };

  const list = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let base = COMPONENTS;
    if (cat === "favorites") base = COMPONENTS.filter((c) => fav.includes(c.id));
    else if (cat === "recent") base = recent.map(componentById).filter((c): c is Component => !!c);
    else if (cat !== "all") base = COMPONENTS.filter((c) => c.category === cat);
    return terms.length ? base.filter((c) => terms.every((t) => haystack(c).includes(t))) : base;
  }, [q, cat, fav, recent]);

  const logo = useBrandLogoSvg(p, custom.dark);
  const open = (id: string) => {
    setOpenId(id);
    updateProject(p.id, (x) => { const r = [id, ...(x.library?.recent ?? []).filter((y) => y !== id)].slice(0, 8); x.library = { favorites: x.library?.favorites ?? [], recent: r }; });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };
  const toggleFav = (id: string) => updateProject(p.id, (x) => {
    const f = x.library?.favorites ?? [];
    x.library = { favorites: f.includes(id) ? f.filter((y) => y !== id) : [id, ...f], recent: x.library?.recent ?? [] };
  });
  const find = (query: string) => {
    try { sessionStorage.setItem("dp:refquery", query); } catch { /* ignore */ }
    goto("similar");
  };

  const current = openId ? componentById(openId) : undefined;
  return (
    <div>
      <LibraryStyles />
      {current ? (
        <ComponentDetail key={current.id + d.id} project={p} component={current} direction={d} custom={custom} setCustom={setCustom} favorite={fav.includes(current.id)} onFavorite={() => toggleFav(current.id)} onBack={() => setOpenId(null)} onFind={find} logo={logo} brandName={p.brand?.profile.name} />
      ) : (<>
        <SectionHead title="UI components" desc={`${COMPONENTS.length} components, drawn live with the colors, fonts, radius and spacing of your selected direction. Open one to customize it, check its states and export it.`}
          right={<Button size="sm" onClick={() => download(`${d.name.toLowerCase().replace(/\W+/g, "-")}-components.css`, componentsCssFile({ ...p, selectedDirection: d.id }), "text/css")}><Download size={14} aria-hidden /> All component CSS</Button>} />
        <div className="mb-4 flex flex-wrap items-center gap-2"><span className="text-xs text-faint">Preview in direction</span>{p.directions.map((x) => <Chip key={x.id} active={x.id === d.id} onClick={() => pickDirection(x.id)}>{x.name}</Chip>)}</div>
        <div className="relative mb-3">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search components" placeholder="Search components, e.g. button, table, focus, radius…" className="h-11 w-full rounded-xl border border-line bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
        </div>
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All ({COMPONENTS.length})</Chip>
          {CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{CATEGORY_LABEL[c]} ({COMPONENTS.filter((x) => x.category === c).length})</Chip>)}
          <Chip active={cat === "favorites"} onClick={() => setCat("favorites")}><Star size={12} className="mr-1 inline" aria-hidden />Favorites ({fav.length})</Chip>
          <Chip active={cat === "recent"} onClick={() => setCat("recent")}><Clock size={12} className="mr-1 inline" aria-hidden />Recently viewed ({recent.length})</Chip>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{list.length} components shown</p>
        {list.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-fg">{cat === "favorites" ? "No favorites yet" : cat === "recent" ? "Nothing viewed yet" : "No components match"}</p>
            <p className="mt-1 text-sm text-muted">{cat === "favorites" ? "Open a component and tap the star to keep it here." : cat === "recent" ? "Components you open appear here." : "Try a shorter search, or clear the category filter."}</p>
            <div className="mt-4"><Button onClick={() => { setQ(""); setCat("all"); }}>Show all components</Button></div>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <li key={c.id} className="relative">
                <Card className="overflow-hidden p-0 transition-colors hover:border-accent/60">
                  <Thumb c={c} project={p} custom={custom} dirId={d.id} />
                  <button type="button" onClick={() => open(c.id)} className="block w-full p-4 pr-12 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                    <span className="flex items-center gap-2"><span className="font-medium text-fg">{c.name}</span><Badge>{CATEGORY_LABEL[c.category]}</Badge></span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted">{c.desc}</span>
                  </button>
                </Card>
                <button type="button" onClick={() => toggleFav(c.id)} aria-pressed={fav.includes(c.id)} aria-label={fav.includes(c.id) ? `Remove ${c.name} from favorites` : `Add ${c.name} to favorites`} className={`absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-lg hover:bg-hover ${fav.includes(c.id) ? "text-accent" : "text-faint"}`}><Star size={16} fill={fav.includes(c.id) ? "currentColor" : "none"} aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
      </>)}
    </div>
  );
}
