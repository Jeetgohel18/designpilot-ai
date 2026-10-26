/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Badge, Button, Card, Chip, CopyButton, inputCls, Notice, SectionHead, SourceBadge } from "../ui";
import { ICON_LIBRARIES, ILLUSTRATION_SOURCES, imageSearchLinks } from "@/lib/engine/resources";
import { BookmarkButton, type TabProps } from "./shared";

type IconRes = { icons?: string[]; collections?: Record<string, { name: string; license: { title: string; url?: string } }>; error?: string };
type ImgRes = { configured: boolean; reason?: string; error?: string; photos?: { id: string; alt: string; thumb: string; page: string; author: string; authorUrl: string }[] };

export function AssetsTab({ project: p, direction: d }: TabProps) {
  const [sub, setSub] = useState<"icons" | "illustrations" | "images">("icons");
  const [iconStyle, setIconStyle] = useState("all");
  const [illStyle, setIllStyle] = useState("all");
  const [iq, setIq] = useState("");
  const [icons, setIcons] = useState<IconRes | null>(null);
  const [iconBusy, setIconBusy] = useState(false);
  const [imgQ, setImgQ] = useState(() => `${p.profile.keywords.slice(0, 2).join(" ")} ${d?.imageStyle.split(",")[0].toLowerCase() ?? ""}`.trim());
  const [imgs, setImgs] = useState<ImgRes | null>(null);
  const [imgBusy, setImgBusy] = useState(false);

  async function searchIcons(e: React.FormEvent) {
    e.preventDefault(); if (!iq.trim()) return;
    setIconBusy(true);
    try { const r = await fetch(`/api/icons?q=${encodeURIComponent(iq)}`); setIcons(await r.json()); } catch { setIcons({ error: "Couldn't reach the icon search." }); } finally { setIconBusy(false); }
  }
  async function searchImgs(e?: React.FormEvent) {
    e?.preventDefault(); setImgBusy(true);
    try { setImgs(await (await fetch(`/api/images?q=${encodeURIComponent(imgQ)}`)).json()); } catch { setImgs({ configured: true, error: "Couldn't reach the image search." }); } finally { setImgBusy(false); }
  }

  const libs = ICON_LIBRARIES.filter((l) => iconStyle === "all" || l.styles.includes(iconStyle));
  const ills = ILLUSTRATION_SOURCES.filter((l) => illStyle === "all" || l.styles.includes(illStyle));
  const imgLinks = imageSearchLinks(imgQ);

  return (
    <div className="rise">
      <SectionHead title="Icons, illustrations & imagery" desc={d ? `Sources matched to the “${d.name}” direction: ${d.iconStyle.toLowerCase()}; ${d.illustrationStyle.toLowerCase()}.` : undefined} />
      <div className="mb-5 flex gap-2">{(["icons", "illustrations", "images"] as const).map((s) => <Chip key={s} active={sub === s} onClick={() => setSub(s)}>{s[0].toUpperCase() + s.slice(1)}</Chip>)}</div>

      {sub === "icons" && (
        <>
          <form onSubmit={searchIcons} className="mb-4 flex max-w-xl gap-2"><input value={iq} onChange={(e) => setIq(e.target.value)} placeholder="Search icons live (e.g. cart, leaf, chart)…" aria-label="Search icons" className={inputCls} /><Button type="submit" variant="primary" disabled={iconBusy}>{iconBusy ? "…" : "Search"}</Button></form>
          {icons?.error && <div className="mb-4"><Notice tone="warn">{icons.error}</Notice></div>}
          {icons?.icons && (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2"><SourceBadge kind="live" /><span className="text-xs text-faint">Iconify API · each icon set has its own licence — check before use</span></div>
              {icons.icons.length === 0 ? <p className="text-sm text-muted">No icons found.</p> : <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-12">{icons.icons.map((id) => { const [prefix, name] = id.split(":"); const lic = icons.collections?.[prefix]?.license.title; return (
                <div key={id} className="group relative flex aspect-square items-center justify-center rounded-lg border border-line bg-surface p-2.5 hover:border-line-strong" title={`${id}${lic ? ` · ${lic}` : ""}`}>
                  <img src={`https://api.iconify.design/${prefix}/${name}.svg?color=%23ececf1`} alt={name} className="h-full w-full" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-0.5 rounded-b-lg bg-elevated/95 py-0.5 group-hover:flex group-focus-within:flex"><CopyButton text={id} label="id" what="Icon id" /></div>
                </div>); })}</div>}
            </div>
          )}
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-xs text-faint">Style</span>{["all", "line", "filled", "duotone", "animated"].map((s) => <Chip key={s} active={iconStyle === s} onClick={() => setIconStyle(s)}>{s}</Chip>)}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{libs.map((l) => (
            <Card key={l.name} className="flex flex-col p-4">
              <div className="flex items-start justify-between"><h4 className="text-sm font-medium">{l.name}</h4><BookmarkButton p={p} b={{ kind: "icon", title: l.name, url: l.url, source: "Icon library" }} /></div>
              <p className="mt-1 text-[13px] text-muted">{l.note}</p>
              <div className="mt-2 flex flex-wrap gap-1">{l.styles.map((s) => <Badge key={s}>{s}</Badge>)}<Badge tone="neutral" title="As documented by the project; confirm on the source">Licence: {l.license}</Badge></div>
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-elevated px-2 py-1.5 font-mono text-[11px] text-muted"><span className="truncate">{l.install}</span><span className="ml-auto"><CopyButton text={l.install} what="Install command" /></span></div>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-xs text-accent hover:underline">Open {l.name} ↗</a>
            </Card>
          ))}</div>
        </>
      )}

      {sub === "illustrations" && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-xs text-faint">Style</span>{["all", "2D", "3D", "flat", "hand-drawn", "editorial", "abstract", "animated"].map((s) => <Chip key={s} active={illStyle === s} onClick={() => setIllStyle(s)}>{s}</Chip>)}</div>
          <div className="mb-4"><Notice>Licence notes are <strong>as last documented by us</strong> and can change. Confirm the licence and any attribution requirement on the source before using an illustration commercially.</Notice></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ills.map((l) => (
            <Card key={l.name} className="flex flex-col p-4">
              <div className="flex items-start justify-between"><h4 className="text-sm font-medium">{l.name}</h4><BookmarkButton p={p} b={{ kind: "asset", title: l.name, url: l.url, source: "Illustration" }} /></div>
              <p className="mt-1 text-[13px] text-muted">{l.note}</p>
              <div className="mt-2 flex flex-wrap gap-1">{l.styles.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              <p className="mt-2 text-xs text-faint"><span className="text-muted">Licence:</span> {l.license}</p>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 text-xs text-accent hover:underline">Open {l.name} ↗</a>
            </Card>
          ))}</div>
          {d && <p className="mt-4 text-xs text-faint">Direction brief: {d.illustrationStyle}.</p>}
        </>
      )}

      {sub === "images" && (
        <>
          <form onSubmit={searchImgs} className="mb-4 flex max-w-xl gap-2"><input value={imgQ} onChange={(e) => setImgQ(e.target.value)} aria-label="Image search" className={inputCls} /><Button type="submit" variant="primary" disabled={imgBusy}>{imgBusy ? "…" : "Search photos"}</Button></form>
          {!imgs && <p className="mb-4 text-xs text-faint">Query is pre-filled from your project and direction. Press Search to try live results.</p>}
          {imgs && !imgs.configured && <div className="mb-4"><Notice>Live photo results are off. {imgs.reason} Add a free <code className="rounded bg-elevated px-1">UNSPLASH_ACCESS_KEY</code> to preview photos here with proper attribution. The search links below work without it.</Notice></div>}
          {imgs?.error && <div className="mb-4"><Notice tone="warn">{imgs.error}</Notice></div>}
          {imgs?.photos && (
            <div className="mb-6"><div className="mb-2 flex items-center gap-2"><SourceBadge kind="live" /><span className="text-xs text-faint">Unsplash · free to use under the Unsplash License; attribution shown</span></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{imgs.photos.map((ph) => (
                <figure key={ph.id} className="overflow-hidden rounded-xl border border-line bg-surface">
                  <a href={ph.page} target="_blank" rel="noopener noreferrer"><img src={ph.thumb} alt={ph.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" /></a>
                  <figcaption className="flex items-center justify-between gap-2 p-2 text-[11px] text-muted"><span className="truncate">Photo by <a className="underline hover:text-fg" href={ph.authorUrl} target="_blank" rel="noopener noreferrer">{ph.author}</a> on <a className="underline hover:text-fg" href="https://unsplash.com/?utm_source=designpilot&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></span><BookmarkButton p={p} b={{ kind: "asset", title: `Photo by ${ph.author}`, url: ph.page, source: "Unsplash" }} /></figcaption>
                </figure>))}</div></div>
          )}
          <h4 className="mb-2 text-sm font-medium">Stock photo search links</h4>
          <div className="grid gap-3 sm:grid-cols-3">{imgLinks.map((l) => (
            <Card key={l.name} className="flex flex-col p-4"><div className="flex items-start justify-between"><h4 className="text-sm font-medium">{l.name}</h4><BookmarkButton p={p} b={{ kind: "asset", title: `${l.name}: ${imgQ}`, url: l.url, source: l.name }} /></div><p className="mt-1 text-[13px] text-muted">{l.note}</p><p className="mt-2 text-xs text-faint"><span className="text-muted">Licence:</span> {l.license}</p><a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 text-xs text-accent hover:underline">Search “{imgQ}” ↗</a></Card>
          ))}</div>
          {d && <p className="mt-4 text-xs text-faint">Direction brief: {d.imageStyle}.</p>}
        </>
      )}
    </div>
  );
}
