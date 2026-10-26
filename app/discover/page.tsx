"use client";
import { useState } from "react";
import { Shell } from "@/components/SiteChrome";
import { Button, Card, inputCls, Notice, SourceBadge } from "@/components/ui";
import { competitorSearchLinks, imageSearchLinks, referenceSearchLinks, type SourceLink } from "@/lib/engine/resources";
import Link from "next/link";

const IDEAS = ["skincare brand website", "fintech dashboard", "coffee roaster packaging", "meditation app", "architecture portfolio"];

function Group({ title, links }: { title: string; links: SourceLink[] }) {
  return (
    <section className="mt-8"><h2 className="mb-3 text-base font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{links.map((l) => (
        <Card key={l.name} className="flex flex-col p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-medium">{l.name}</h3><SourceBadge kind={l.kind === "search" ? "search" : "curated"} /></div><p className="mt-1.5 text-[13px] text-muted">{l.note}</p>{l.license && <p className="mt-1 text-xs text-faint">Licence: {l.license}</p>}<a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-3 text-xs text-accent hover:underline">Open ↗</a></Card>
      ))}</div></section>
  );
}

export default function Discover() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">Search for inspiration across design sources without creating a project. For results tuned to your brief and chosen direction, <Link href="/#start" className="text-accent underline">start a project</Link>.</p>
        <form onSubmit={(e) => { e.preventDefault(); setActive(q.trim()); }} className="mt-6 flex max-w-2xl gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. luxury skincare e-commerce" aria-label="Search for inspiration" className={inputCls} maxLength={120} /><Button type="submit" variant="primary" size="md">Discover</Button></form>
        <div className="mt-3 flex flex-wrap gap-2">{IDEAS.map((i) => <button key={i} onClick={() => { setQ(i); setActive(i); }} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-fg">{i}</button>)}</div>
        {active ? (
          <>
            <div className="mt-6"><Notice>These open each source&rsquo;s own results for “{active}”. Order is fixed and results are not verified or ranked by DesignPilot.</Notice></div>
            <Group title="Design inspiration" links={referenceSearchLinks(active)} />
            <Group title="Competitors & alternatives" links={competitorSearchLinks([active])} />
            <Group title="Photography" links={imageSearchLinks(active)} />
          </>
        ) : <p className="mt-16 text-center text-sm text-faint">Enter a topic to get started.</p>}
      </div>
    </Shell>
  );
}
