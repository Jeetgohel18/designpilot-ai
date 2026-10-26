"use client";
import { useState } from "react";
import { Badge, Button, Card, CopyButton, Field, inputCls, Notice, SectionHead, SourceBadge, useToast } from "../ui";
import { brandSearchLinks, LOGO_TYPES, TOOLS } from "@/lib/engine/resources";
import { logoConcepts } from "@/lib/engine/handoff";
import { updateProject } from "@/lib/store";
import { fontFamilyCss } from "@/lib/fonts";
import { useGoogleFonts } from "../FontLoader";
import type { TabProps } from "./shared";

export function BrandTab({ project: p, direction: d }: TabProps) {
  const toast = useToast();
  const [brand, setBrand] = useState("");
  useGoogleFonts(d ? [d.fonts.heading] : [], true);
  if (!d) return <Notice>Select a direction first.</Notice>;
  const concepts = logoConcepts(brand, d);
  const initials = (brand || "B").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const c = d.palette.colors;

  return (
    <div className="rise">
      <SectionHead title="Brand identity & logo" desc={`Brand research and original logo concepts for “${d.name}”.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Card className="p-4">
            <h3 className="mb-1 text-sm font-medium">Brands to research</h3>
            <p className="mb-3 text-xs text-faint">Well-known brands in {p.profile.industry.toLowerCase()} that suit this direction. These are names to look up — DesignPilot does not state their exact colors or fonts. Always take those from official guidelines.</p>
            <div className="space-y-3">{d.brandReferences.map((b) => (
              <div key={b} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{b}</span><SourceBadge kind={p.source === "ai" ? "ai" : "curated"} /></div>
                <div className="mt-2 flex flex-wrap gap-1.5">{brandSearchLinks(b).map((l) => <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" title={l.note} className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-fg">{l.name} ↗</a>)}</div>
              </div>
            ))}</div>
          </Card>
          <Card className="mt-4 p-4">
            <h3 className="mb-2 text-sm font-medium">Logo types</h3>
            <dl className="space-y-2 text-[13px]">{LOGO_TYPES.map((t) => <div key={t.type}><dt className="font-medium">{t.type}</dt><dd className="text-muted">{t.how}</dd></div>)}</dl>
          </Card>
          <Card className="mt-4 p-4">
            <h3 className="mb-2 text-sm font-medium">Logo &amp; brand tools</h3>
            <ul className="flex flex-wrap gap-1.5">{TOOLS.filter((t) => ["Looka", "Wordmark.it", "Logoipsum", "Coolors", "Type Scale"].includes(t.name)).map((t) => <li key={t.name}><a href={t.url} target="_blank" rel="noopener noreferrer" title={t.note} className="inline-block rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-fg">{t.name} ↗</a></li>)}</ul>
          </Card>
        </div>

        <div>
          <Card className="p-4">
            <h3 className="mb-1 text-sm font-medium">Original logo concepts</h3>
            <div className="mb-3 flex items-center gap-2"><Badge tone="warn">Generated concepts</Badge><span className="text-xs text-faint">Descriptions for you to design or brief — not existing brand logos.</span></div>
            <Field label="Brand name"><input className={inputCls} value={brand} placeholder={p.name} onChange={(e) => setBrand(e.target.value)} /></Field>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex h-24 items-center justify-center rounded-lg border border-line text-2xl" style={{ background: c.background, color: c.primary, fontFamily: fontFamilyCss(d.fonts.heading) }}>{brand || "Brand"}</div>
              <div className="flex h-24 items-center justify-center rounded-lg border border-line" style={{ background: c.primary }}><span className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg" style={{ color: c.background, borderColor: c.background, fontFamily: fontFamilyCss(d.fonts.heading) }}>{initials}</span></div>
            </div>
            <p className="mt-1.5 text-[11px] text-faint">Layout sketches only: your name in the heading font, and a monogram seal. Not final artwork.</p>
            <div className="mt-4 space-y-3">{concepts.map((k) => (
              <div key={k.type} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{k.type}</span><div className="flex gap-1.5"><CopyButton text={k.prompt} label="Copy prompt" what="Prompt" /></div></div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{k.idea}</p>
                <p className="mt-2 rounded bg-elevated p-2 font-mono text-[11px] leading-relaxed text-faint">{k.prompt}</p>
              </div>
            ))}</div>
            <div className="mt-3 flex items-center justify-between"><Button size="sm" onClick={() => { updateProject(p.id, (x) => { if (brand.trim()) x.name = brand.trim(); }, "Set brand name"); toast(brand.trim() ? "Project renamed to your brand name" : "Enter a brand name first", brand.trim() ? "ok" : "error"); }}>Use as project name</Button></div>
          </Card>
          <div className="mt-4"><Notice>Visual logo generation isn&rsquo;t connected in this version: the prompts above are written for any image generator. Review generated marks for similarity to existing logos before use, and never present them as another company&rsquo;s official logo.</Notice></div>
        </div>
      </div>
    </div>
  );
}
