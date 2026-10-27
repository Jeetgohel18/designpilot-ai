"use client";
import { useState } from "react";
import { Button, Card, Chip, CopyButton, Notice, SectionHead, download } from "../ui";
import { accessibilityNotes, designBrief, fullCss, handoffBundle } from "@/lib/engine/handoff";
import { ICON_LIBRARIES, UI_RESOURCES } from "@/lib/engine/resources";
import { darkTheme } from "@/lib/engine/palette";
import { ROLES } from "@/lib/types";
import type { TabProps } from "./shared";

export function HandoffTab({ project: p, direction: d, goto }: TabProps) {
  const [tab, setTab] = useState<"brief" | "css" | "tokens" | "tailwind" | "fonts">("brief");
  if (!d) return <Notice>Select a direction first — the handoff is built from it.</Notice>;
  const b = handoffBundle(d);
  const brief = designBrief(p);
  const items = {
    brief: { label: "Design brief", text: brief, file: "design-brief.md" },
    css: { label: "CSS variables", text: fullCss(d), file: "design-tokens.css" },
    tokens: { label: "JSON tokens", text: b.tokens, file: "design-tokens.json" },
    tailwind: { label: "Tailwind v4 theme", text: b.tailwind, file: "theme.css" },
    fonts: { label: "Font setup", text: `${b.fontLink}\n\n${b.nextFont}`, file: "fonts.txt" },
  } as const;
  const cur = items[tab];
  const assets = p.bookmarks.filter((x) => x.url);
  const dk = darkTheme(d.palette.colors);

  return (
    <div className="rise">
      <SectionHead title="Developer handoff" desc={`Built from the “${d.name}” direction. Every block is copyable or downloadable.`} right={<><Button size="sm" onClick={() => Object.values(items).forEach((i) => download(i.file, i.text))}>Download these files</Button><Button size="sm" variant="primary" onClick={() => goto("export")}>Open Export center</Button></>} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
          <div className="flex flex-wrap gap-1.5">{(Object.keys(items) as (keyof typeof items)[]).map((k) => <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{items[k].label}</Chip>)}</div>
          <div className="flex gap-1.5"><CopyButton text={cur.text} what={cur.label} size="md" /><Button onClick={() => download(cur.file, cur.text)}>Download {cur.file}</Button></div>
        </div>
        <pre className="scroll-thin max-h-[480px] overflow-auto p-4 font-mono text-[12px] leading-relaxed text-muted whitespace-pre-wrap">{cur.text}</pre>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium">Color tokens</h3>
          <table className="w-full text-xs"><thead><tr className="text-left text-faint"><th className="pb-1.5 font-normal">Token</th><th className="pb-1.5 font-normal">Light</th><th className="pb-1.5 font-normal">Dark (derived)</th></tr></thead>
            <tbody>{ROLES.map((r) => <tr key={r} className="border-t border-line"><td className="py-1.5 font-mono text-muted">--color-{r}</td><td className="py-1.5"><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-line-strong align-middle" style={{ background: d.palette.colors[r] }} /><span className="font-mono">{d.palette.colors[r]}</span></td><td className="py-1.5"><span className="mr-1.5 inline-block h-3 w-3 rounded-sm border border-line-strong align-middle" style={{ background: dk[r] }} /><span className="font-mono">{dk[r]}</span></td></tr>)}</tbody></table>
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium">Accessibility recommendations</h3>
          <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted">{accessibilityNotes(d).map((n) => <li key={n}>{n}</li>)}</ul>
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium">Implementation notes</h3>
          <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted">
            <li>Build the first screens from: {d.components.join(", ")}.</li>
            <li>Self-host fonts with <a className="text-accent underline" href="https://fontsource.org/" target="_blank" rel="noopener noreferrer">Fontsource</a> or <code>next/font</code> for performance and privacy.</li>
            <li>Icons: {d.iconStyle}. Keep one library across the product.</li>
            <li>Imagery: {d.imageStyle}.</li>
            <li>Define spacing on a 4px scale; radii 6 / 12 / 20px (included in the tokens above).</li>
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-medium">Component libraries &amp; icon packages</h3>
          <ul className="space-y-1.5 text-[13px]">{UI_RESOURCES.slice(0, 5).map((u) => <li key={u.name} className="flex justify-between gap-2"><a className="text-accent hover:underline" href={u.url} target="_blank" rel="noopener noreferrer">{u.name} ↗</a><span className="text-xs text-faint">{u.license}</span></li>)}</ul>
          <div className="mt-3 border-t border-line pt-3"><ul className="space-y-1.5 text-[13px]">{ICON_LIBRARIES.slice(0, 4).map((u) => <li key={u.name} className="flex items-center justify-between gap-2"><a className="text-accent hover:underline" href={u.url} target="_blank" rel="noopener noreferrer">{u.name} ↗</a><code className="text-xs text-faint">{u.install}</code></li>)}</ul></div>
        </Card>
      </div>
      <Card className="mt-4 p-4">
        <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-medium">Asset source URLs (your bookmarks)</h3>{assets.length > 0 && <CopyButton text={assets.map((a) => `${a.title} — ${a.url}`).join("\n")} what="Source list" />}</div>
        {assets.length === 0 ? <p className="text-sm text-faint">Bookmark references, fonts, icons and assets in the other tabs and they&rsquo;ll be listed here with their source URLs.</p> : <ul className="space-y-1 text-[13px]">{assets.map((a) => <li key={a.id} className="truncate"><span className="text-muted">{a.title}</span> — <a className="text-accent hover:underline" href={a.url} target="_blank" rel="noopener noreferrer">{a.url}</a></li>)}</ul>}
      </Card>
    </div>
  );
}
