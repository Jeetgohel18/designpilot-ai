/* eslint-disable @next/next/no-img-element */
"use client";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Image as ImageIcon, Maximize2, Search, Type } from "lucide-react";
import { Badge, Button, Card, Chip, CopyButton, EmptyState, inputCls, Notice, SectionHead, Skeleton, SourceBadge, useToast } from "../ui";
import { DESIGN_SYSTEMS, ICON_LIBRARIES, ILLUSTRATION_SOURCES, TEXTURE_SOURCES, UI_RESOURCES, imageSearchLinks, textureSearchLinks, type SourceLink } from "@/lib/engine/resources";
import { SmartImage, Lightbox, type LightboxItem } from "../media";
import { fontFamilyCss } from "@/lib/fonts";
import { useGoogleFonts } from "../FontLoader";
import { BookmarkButton, type TabProps } from "./shared";

type IconRes = { icons?: string[]; collections?: Record<string, { name: string; license?: { title: string; spdx?: string } }>; error?: string };
type ImgRes = { configured: boolean; reason?: string; error?: string; photos?: { id: string; alt: string; thumb: string; page: string; author: string; authorUrl: string }[] };
const CATS = ["all", "photos", "icons", "illustrations", "textures", "fonts", "systems"] as const;
const CAT_LABEL: Record<(typeof CATS)[number], string> = { all: "All", photos: "Photos", icons: "Icons", illustrations: "Illustrations", textures: "Textures & backgrounds", fonts: "Fonts", systems: "Design systems & UI kits" };
const PERMISSIVE = /\b(MIT|ISC|Apache|CC0|BSD|OFL)\b/i;
// Downloading is offered only for icon SVGs whose collection reports one of these SPDX licences.
const DOWNLOADABLE_SPDX = new Set(["MIT", "ISC", "Apache-2.0", "CC0-1.0", "BSD-3-Clause", "BSD-2-Clause", "0BSD"]);

interface Row { key: string; cat: (typeof CATS)[number]; link: SourceLink; styles?: string[]; extra?: string }

function Tile({ r, p }: { r: Row; p: TabProps["project"] }) {
  const l = r.link;
  let host = ""; try { host = new URL(l.url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
  return (
    <Card className="flex min-w-0 flex-col overflow-hidden">
      <div className="flex aspect-[16/7] items-center justify-center bg-elevated text-faint" aria-hidden><span className="flex flex-col items-center gap-1"><ImageIcon size={20} /><span className="text-[11px]">{CAT_LABEL[r.cat]}</span></span></div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="text-sm font-medium">{l.name}</h4><p className="truncate text-[11px] text-faint">{host}</p></div><BookmarkButton p={p} b={{ kind: "asset", title: l.name, url: l.url, source: CAT_LABEL[r.cat] }} /></div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{l.note}</p>
        <div className="mt-2 flex flex-wrap gap-1"><SourceBadge kind={l.kind === "search" ? "search" : "curated"} />{r.styles?.map((s) => <Badge key={s}>{s}</Badge>)}</div>
        {l.license && <p className="mt-2 text-xs text-faint"><span className="text-muted">Licence:</span> {l.license}</p>}
        {r.extra && <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-elevated px-2 py-1.5 font-mono text-[11px] text-muted"><span className="truncate">{r.extra}</span><span className="ml-auto"><CopyButton text={r.extra} what="Install command" /></span></div>}
        <a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-9 items-center gap-1.5 pt-3 text-xs text-accent hover:underline"><ExternalLink size={13} aria-hidden />Open source</a>
      </div>
    </Card>
  );
}

export function AssetsTab({ project: p, direction: d }: TabProps) {
  const toast = useToast();
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [iq, setIq] = useState("");
  const [icons, setIcons] = useState<IconRes | null>(null);
  const [iconBusy, setIconBusy] = useState(false);
  const [imgQ, setImgQ] = useState(() => `${p.profile.keywords.slice(0, 2).join(" ")} ${d?.imageStyle.split(",")[0].toLowerCase() ?? ""}`.trim());
  const [imgs, setImgs] = useState<ImgRes | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [big, setBig] = useState<LightboxItem | null>(null);
  useGoogleFonts(d ? [d.fonts.heading, d.fonts.body] : [], true);

  async function searchIcons(e: React.FormEvent) {
    e.preventDefault(); if (!iq.trim()) return;
    setIconBusy(true); setIcons(null);
    try { setIcons(await (await fetch(`/api/icons?q=${encodeURIComponent(iq)}`)).json()); } catch { setIcons({ error: "Couldn't reach the icon search." }); } finally { setIconBusy(false); }
  }
  async function searchImgs(e?: React.FormEvent) {
    e?.preventDefault(); setImgBusy(true); setImgs(null);
    try { setImgs(await (await fetch(`/api/images?q=${encodeURIComponent(imgQ)}`)).json()); } catch { setImgs({ configured: true, error: "Couldn't reach the image search." }); } finally { setImgBusy(false); }
  }
  async function downloadSvg(id: string) {
    const [prefix, name] = id.split(":");
    try {
      const res = await fetch(`https://api.iconify.design/${prefix}/${name}.svg`);
      if (!res.ok) throw new Error(String(res.status));
      const svg = await res.text();
      if (!svg.trimStart().startsWith("<svg")) throw new Error("not svg");
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const a = document.createElement("a"); a.href = url; a.download = `${name}.svg`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast(`Downloaded ${name}.svg`);
    } catch { toast("Couldn't download that icon. Open the source instead.", "error"); }
  }

  const rows = useMemo<Row[]>(() => {
    const kw = `${p.profile.keywords.slice(0, 2).join(" ")} ${p.profile.industry}`.trim();
    return [
      ...imageSearchLinks(imgQ).map((l): Row => ({ key: "ph" + l.name, cat: "photos", link: l })),
      ...ICON_LIBRARIES.map((l): Row => ({ key: "ic" + l.name, cat: "icons", link: l, styles: l.styles, extra: l.install })),
      ...ILLUSTRATION_SOURCES.map((l): Row => ({ key: "il" + l.name, cat: "illustrations", link: l, styles: l.styles })),
      ...[...textureSearchLinks(kw), ...TEXTURE_SOURCES].map((l): Row => ({ key: "tx" + l.name, cat: "textures", link: l })),
      ...(d ? [d.fonts.heading, d.fonts.body].map((f): Row => ({ key: "f" + f, cat: "fonts", link: { name: f, url: `https://fonts.google.com/specimen/${f.replace(/ /g, "+")}`, note: "Your direction's font — specimen, styles and licence on Google Fonts", license: "Open Font Licence / Apache (per Google Fonts) — confirm on site", kind: "directory" } })) : []),
      ...[...DESIGN_SYSTEMS, ...UI_RESOURCES].map((l): Row => ({ key: "ds" + l.name, cat: "systems", link: l })),
    ];
  }, [p, d, imgQ]);

  const shown = rows.filter((r) => (cat === "all" || r.cat === cat) && (!open || PERMISSIVE.test(r.link.license ?? "")) && (!q || `${r.link.name} ${r.link.note} ${r.styles?.join(" ") ?? ""} ${CAT_LABEL[r.cat]}`.toLowerCase().includes(q.toLowerCase())));
  const showLive = cat === "all" || cat === "photos" || cat === "icons";

  return (
    <div className="rise">
      <SectionHead title="Images & assets" desc={d ? `Sources matched to “${d.name}”: ${d.imageStyle.split(",").slice(0, 2).join(",").toLowerCase()}; ${d.iconStyle.toLowerCase()}.` : "Photos, icons, illustrations, textures, fonts and design systems — each with its real source and licence."} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter assets" placeholder="Filter sources by name, style or type…" className={`${inputCls} !pl-9`} /></div>
        <Chip active={open} onClick={() => setOpen(!open)}>Permissive open licences only</Chip>
      </div>
      <div className="scroll-thin mb-5 flex gap-1.5 overflow-x-auto pb-2" role="tablist" aria-label="Asset categories">{CATS.map((c) => <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${cat === c ? "border-accent/50 bg-accent-soft text-[#cfc9ff]" : "border-line text-muted hover:border-line-strong hover:text-fg"}`}>{CAT_LABEL[c]}</button>)}</div>

      {showLive && (cat === "all" || cat === "photos") && (
        <section className="mb-8" aria-labelledby="live-photos">
          <div className="mb-2 flex flex-wrap items-center gap-2"><h3 id="live-photos" className="text-sm font-semibold">Photography search</h3><SourceBadge kind="live" /></div>
          <form onSubmit={searchImgs} className="mb-3 flex max-w-xl gap-2"><input value={imgQ} onChange={(e) => setImgQ(e.target.value)} aria-label="Photo search" className={inputCls} /><Button type="submit" variant="primary" disabled={imgBusy}>{imgBusy ? "…" : "Search"}</Button></form>
          {!imgs && !imgBusy && <p className="text-xs text-faint">Pre-filled from your project and direction. Press Search for live Unsplash results.</p>}
          {imgBusy && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading photos">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>}
          {imgs && !imgs.configured && <Notice>Live photo previews are off: no <code className="rounded bg-elevated px-1">UNSPLASH_ACCESS_KEY</code> is set on the server. The stock-photo search links below work without it.</Notice>}
          {imgs?.error && <Notice tone="warn">{imgs.error}</Notice>}
          {imgs?.photos && imgs.photos.length === 0 && <EmptyState title="No photos found">Try fewer or different keywords.</EmptyState>}
          {imgs?.photos && imgs.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{imgs.photos.map((ph) => (
              <figure key={ph.id} className="group overflow-hidden rounded-xl border border-line bg-surface">
                <button className="relative block w-full" onClick={() => setBig({ src: ph.thumb, alt: ph.alt, href: ph.page, credit: <>Photo by <a className="underline" href={ph.authorUrl} target="_blank" rel="noopener noreferrer">{ph.author}</a> on <a className="underline" href="https://unsplash.com/?utm_source=designpilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></> })} aria-label={`Enlarge photo: ${ph.alt}`}>
                  <SmartImage src={ph.thumb} alt={ph.alt} /><span className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden><Maximize2 size={14} /></span>
                </button>
                <figcaption className="flex items-center justify-between gap-2 p-2 text-[11px] text-muted"><span className="truncate">Photo by <a className="underline hover:text-fg" href={ph.authorUrl} target="_blank" rel="noopener noreferrer">{ph.author}</a> on <a className="underline hover:text-fg" href="https://unsplash.com/?utm_source=designpilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></span><BookmarkButton p={p} b={{ kind: "asset", title: `Photo by ${ph.author}`, url: ph.page, source: "Unsplash" }} /></figcaption>
              </figure>))}</div>
          )}
          {imgs?.photos && <p className="mt-2 text-xs text-faint">Free under the Unsplash License; attribution shown. Photos can&rsquo;t be downloaded here — use “Open original” so the photographer is credited and counted.</p>}
        </section>
      )}

      {showLive && (cat === "all" || cat === "icons") && (
        <section className="mb-8" aria-labelledby="live-icons">
          <div className="mb-2 flex flex-wrap items-center gap-2"><h3 id="live-icons" className="text-sm font-semibold">Icon search</h3><SourceBadge kind="live" /><span className="text-xs text-faint">Iconify · each set has its own licence</span></div>
          <form onSubmit={searchIcons} className="mb-3 flex max-w-xl gap-2"><input value={iq} onChange={(e) => setIq(e.target.value)} placeholder="Search icons (e.g. cart, leaf, chart)…" aria-label="Search icons" className={inputCls} /><Button type="submit" variant="primary" disabled={iconBusy}>{iconBusy ? "…" : "Search"}</Button></form>
          {iconBusy && <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-12" role="status" aria-label="Loading icons">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div>}
          {icons?.error && <Notice tone="warn">{icons.error}</Notice>}
          {icons?.icons && icons.icons.length === 0 && <EmptyState title="No icons found">Try a simpler word.</EmptyState>}
          {icons?.icons && icons.icons.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">{icons.icons.map((id) => {
              const [prefix, name] = id.split(":"); const lic = icons.collections?.[prefix]?.license; const canDl = !!lic?.spdx && DOWNLOADABLE_SPDX.has(lic.spdx);
              return (
                <div key={id} className="flex flex-col items-center rounded-lg border border-line bg-surface p-2.5 text-center" title={`${id}${lic ? ` · ${lic.title}` : ""}`}>
                  <img src={`https://api.iconify.design/${prefix}/${name}.svg?color=%23ececf1`} alt={name} loading="lazy" className="h-9 w-9" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                  <span className="mt-1.5 w-full truncate text-[10px] text-faint">{name}</span>
                  <span className="w-full truncate text-[10px] text-faint">{lic?.spdx ?? lic?.title ?? "licence: check"}</span>
                  <div className="mt-1 flex items-center gap-0.5"><CopyButton text={id} label="id" what="Icon id" />{canDl && <button className="rounded p-1.5 text-muted hover:bg-hover hover:text-fg" aria-label={`Download ${name} as SVG`} title={`Download SVG (${lic?.spdx})`} onClick={() => downloadSvg(id)}><Download size={13} aria-hidden /></button>}</div>
                </div>); })}</div>
          )}
          {icons?.icons && icons.icons.length > 0 && <p className="mt-2 text-xs text-faint">A download button appears only for sets with a permissive SPDX licence (MIT, ISC, Apache-2.0, CC0, BSD). Otherwise use the library link.</p>}
        </section>
      )}

      {(cat === "all" || cat === "fonts") && d && (
        <section className="mb-8" aria-labelledby="font-specimens">
          <h3 id="font-specimens" className="mb-2 flex items-center gap-2 text-sm font-semibold"><Type size={15} aria-hidden />Your direction&rsquo;s fonts</h3>
          <div className="grid gap-3 sm:grid-cols-2">{[d.fonts.heading, d.fonts.body].map((f) => <Card key={f} className="overflow-hidden"><div className="flex h-28 items-center justify-center bg-elevated text-5xl" style={{ fontFamily: fontFamilyCss(f), color: d.palette.colors.primary }} aria-hidden>Aa</div><div className="p-3 text-[13px]"><p className="font-medium">{f}</p><a className="text-xs text-accent hover:underline" href={`https://fonts.google.com/specimen/${f.replace(/ /g, "+")}`} target="_blank" rel="noopener noreferrer">Google Fonts ↗</a></div></Card>)}</div>
        </section>
      )}

      {cat === "all" && <h3 className="mb-3 text-sm font-semibold">All sources</h3>}
      {shown.length === 0 ? <EmptyState title="No sources match" action={<Button onClick={() => { setQ(""); setOpen(false); setCat("all"); }}>Clear filters</Button>}>Try a different category or remove the licence filter.</EmptyState> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.filter((r) => !(r.cat === "fonts" && cat === "all")).map((r) => <Tile key={r.key} r={r} p={p} />)}</div>
      )}
      <p className="mt-4 text-xs text-faint">Licence notes reflect what each source documented when we last checked. Always confirm on the source before commercial use. Source tiles show no preview image because these are directories, not individual assets.</p>
      <Lightbox item={big} onClose={() => setBig(null)} />
    </div>
  );
}
