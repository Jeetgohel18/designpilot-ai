"use client";
import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, CopyButton, inputCls, Notice, SectionHead } from "../ui";
import { updateProject } from "@/lib/store";
import { ACCESSIBILITY, STATES, checklist, gridGuidance, starterSet, typeScale } from "@/lib/engine/starterkit";
import { uiStyleOf } from "@/lib/engine/uistyle";
import { fontFamilyCss, cssSnippet } from "@/lib/fonts";
import { useGoogleFonts } from "../FontLoader";
import { ROLES } from "@/lib/types";
import { Wireframe } from "./Wireframe";
import type { TabProps } from "./shared";

const H = ({ children, hint }: { children: React.ReactNode; hint?: string }) => <div className="mb-3 mt-10 first:mt-0"><h3 className="text-base font-semibold tracking-tight">{children}</h3>{hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}</div>;

export function StartTab({ project: p, direction: d, goto }: TabProps) {
  const [extra, setExtra] = useState("");
  useGoogleFonts(d ? [d.fonts.heading, d.fonts.body] : [], true);
  if (!d) return <Notice>Select a direction first.</Notice>;
  const set = starterSet(p);
  const ui = uiStyleOf(d);
  const grid = gridGuidance(d);
  const scale = typeScale(d);
  const done = new Set(p.starter?.done ?? []);
  const items = checklist(p, d);
  const toggle = (id: string) => updateProject(p.id, (x) => { const cur = new Set(x.starter?.done ?? []); if (cur.has(id)) cur.delete(id); else cur.add(id); x.starter = { done: [...cur], extraScreens: x.starter?.extraScreens ?? [] }; });
  const progress = items.filter((i) => done.has(i.id)).length;
  const addScreen = (e: React.FormEvent) => { e.preventDefault(); const t = extra.trim(); if (!t) return; updateProject(p.id, (x) => { x.starter = { done: x.starter?.done ?? [], extraScreens: [...(x.starter?.extraScreens ?? []), t] }; }, `Added screen: ${t}`); setExtra(""); };
  const groups = [...new Set(items.map((i) => i.group))];
  const tree = { primary: set.screens.filter((s) => s.priority === 1), secondary: set.screens.filter((s) => s.priority > 1) };
  const tokenCss = `:root {\n${scale.steps.map((s) => `  --text-${s.name.toLowerCase()}: ${s.size}px; /* line-height ${s.line} */`).join("\n")}\n${grid.spacing.map((n, i) => `  --space-${i + 1}: ${n}px;`).join("\n")}\n}`;

  return (
    <div className="rise">
      <SectionHead title="Start designing" desc={`A practical starting point for “${d.name}”: screens, journeys, layout, type, color and a checklist.`} right={<Badge title="These recommendations are curated by DesignPilot for this kind of project. They are not part of the AI analysis of your brief.">Curated for {set.label} projects</Badge>} />
      <Notice>Screens, journeys and checklists below are <strong>contextual recommendations for this type of project</strong>, not findings from your brief. Type, color and spacing are computed from your selected direction.</Notice>

      <H hint="Tick screens off as you design them. Add your own below.">Recommended screens</H>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {set.screens.map((s) => { const k = `screen:${s.id}`; const on = done.has(k); return (
          <Card key={s.id} className={`p-3 ${on ? "opacity-70" : ""}`}>
            <Wireframe kind={s.wire} label={s.name} />
            <div className="mt-3 flex items-start justify-between gap-2"><div><h4 className="text-sm font-medium">{s.name}</h4><p className="mt-0.5 text-[13px] leading-relaxed text-muted">{s.purpose}</p></div><Badge tone={s.priority === 1 ? "accent" : "neutral"}>{s.priority === 1 ? "Priority" : "Later"}</Badge></div>
            <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2 text-[13px] text-muted"><input type="checkbox" checked={on} onChange={() => toggle(k)} className="h-4 w-4 accent-[var(--accent)]" />Designed</label>
          </Card>); })}
        {(p.starter?.extraScreens ?? []).map((t, i) => (
          <Card key={t + i} className="flex items-start justify-between gap-2 p-4"><div><h4 className="text-sm font-medium">{t}</h4><p className="text-xs text-faint">Your screen</p></div><button aria-label={`Remove ${t}`} className="rounded p-2 text-faint hover:bg-hover hover:text-red-300" onClick={() => updateProject(p.id, (x) => { x.starter = { done: x.starter?.done ?? [], extraScreens: (x.starter?.extraScreens ?? []).filter((_, j) => j !== i) }; })}><Trash2 size={15} aria-hidden /></button></Card>
        ))}
      </div>
      <form onSubmit={addScreen} className="mt-3 flex max-w-md gap-2"><input aria-label="Add a screen" className={inputCls} value={extra} maxLength={80} onChange={(e) => setExtra(e.target.value)} placeholder="Add your own screen, e.g. Gift cards" /><Button type="submit"><Plus size={15} aria-hidden />Add</Button></form>

      <H hint="How people are likely to move through the product.">Core user journeys</H>
      <ol className="space-y-2">{set.journeys.map((j, i) => <li key={j} className="flex gap-3 rounded-lg border border-line bg-surface p-3 text-[13px]"><span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>{j}</li>)}</ol>

      <H hint="Suggested information architecture based on the priority of each screen.">Screen hierarchy</H>
      <Card className="p-4 text-[13px]"><p className="font-medium">Global navigation</p>
        <div className="ml-3 mt-2 border-l border-line-strong pl-4"><p className="text-xs text-faint">Primary screens</p><ul className="mb-3 mt-1 space-y-1">{tree.primary.map((s) => <li key={s.id}>{s.name}</li>)}</ul><p className="text-xs text-faint">Secondary / utility</p><ul className="mt-1 space-y-1 text-muted">{tree.secondary.map((s) => <li key={s.id}>{s.name}</li>)}{!tree.secondary.length && <li>—</li>}</ul></div></Card>

      <H hint={`Direction layout style: ${ui.layout}; density: ${ui.density}.`}>Layout, grid &amp; spacing</H>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4"><h4 className="mb-2 text-sm font-medium">Layout recommendations</h4><ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted"><li>{d.uiInspiration[0]}</li><li>Corner radius {ui.radius}px, {ui.border.split(" ")[0]} borders.</li><li>{ui.buttons}.</li><li>Motion: {ui.motion}.</li>{ui.traits.map((t) => <li key={t}>{t}</li>)}</ul></Card>
        <Card className="p-4"><h4 className="mb-2 text-sm font-medium">Grid &amp; breakpoints</h4><table className="w-full text-[13px]"><tbody>{grid.breakpoints.map(([n, r, x]) => <tr key={n} className="border-b border-line last:border-0"><th scope="row" className="py-2 pr-3 text-left font-medium">{n}<span className="block text-[11px] font-normal text-faint">{r}</span></th><td className="py-2 text-muted">{x}</td></tr>)}</tbody></table>
          <p className="mb-1.5 mt-3 text-xs text-faint">Spacing scale (base {grid.unit}px)</p><div className="flex flex-wrap items-end gap-2">{grid.spacing.map((n) => <div key={n} className="text-center"><div className="mx-auto rounded-sm bg-accent/70" style={{ width: Math.min(n, 64), height: 10 }} /><span className="font-mono text-[10px] text-faint">{n}</span></div>)}</div></Card>
      </div>

      <H hint={`Modular scale ×${scale.ratio} from ${scale.base}px, using your selected fonts.`}>Typography scale</H>
      <Card className="p-4">
        <div className="space-y-2.5">{scale.steps.map((s) => <div key={s.name} className="flex flex-wrap items-baseline gap-x-4 border-b border-line pb-2 last:border-0"><span className="w-16 shrink-0 font-mono text-[11px] text-faint">{s.name} · {s.size}px</span><span className="min-w-0 flex-1 truncate" style={{ fontFamily: fontFamilyCss(s.name === "Body" || s.name === "Small" ? d.fonts.body : d.fonts.heading), fontSize: Math.min(s.size, 44), lineHeight: s.line }}>Considered design</span><span className="text-xs text-muted">{s.use}</span></div>)}</div>
        <div className="mt-3 flex flex-wrap gap-2"><CopyButton text={tokenCss} label="Copy scale + spacing CSS" what="Type and spacing CSS" /><CopyButton text={cssSnippet(d.fonts)} label="Copy font CSS" what="Font CSS" /></div>
      </Card>

      <H hint="From the selected direction. Edit them in the Color tab.">Color tokens</H>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{ROLES.map((r) => <div key={r} className="overflow-hidden rounded-lg border border-line"><div className="h-12" style={{ background: d.palette.colors[r] }} /><div className="p-2"><p className="text-xs font-medium capitalize">{r}</p><p className="font-mono text-[11px] text-faint">{d.palette.colors[r]}</p></div></div>)}</div>

      <H>Component recommendations</H>
      <div className="flex flex-wrap gap-1.5">{d.components.map((c) => <Badge key={c} tone="accent">{c}</Badge>)}</div>
      <p className="mt-2 text-[13px] text-muted">Try them with your colors and fonts in the <button className="text-accent underline" onClick={() => goto("components")}>UI components</button> tab.</p>

      <H>Responsive suggestions</H>
      <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted"><li>Design at 375px first, then expand to 768px and 1280px.</li><li>Stack columns into one below 640px; keep primary actions within thumb reach.</li><li>Navigation: drawer or bottom bar on mobile, top bar or sidebar on desktop.</li><li>Tables: scroll inside a bordered container, or turn rows into cards.</li><li>Test with the on-screen keyboard open — forms must stay usable.</li></ul>

      <div className="grid gap-4 md:grid-cols-2">
        <div><H>States to design for every screen</H><ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">{STATES.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><H>Accessibility reminders</H><ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">{ACCESSIBILITY.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>

      <H hint={`${progress} of ${items.length} done. Progress is saved in this browser and included in the checklist export.`}>Prioritized design checklist</H>
      <Card className="p-4">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-elevated" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={items.length} aria-label="Checklist progress"><div className="h-full bg-accent transition-all" style={{ width: `${(progress / items.length) * 100}%` }} /></div>
        {groups.map((g) => <fieldset key={g} className="mb-3 last:mb-0"><legend className="mb-1 text-xs font-medium uppercase tracking-wider text-faint">{g}</legend>{items.filter((i) => i.group === g).map((i) => <label key={i.id} className="flex min-h-10 cursor-pointer items-start gap-2.5 py-1.5 text-[13px]"><input type="checkbox" checked={done.has(i.id)} onChange={() => toggle(i.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" /><span className={done.has(i.id) ? "text-faint line-through" : ""}>{i.text}</span></label>)}</fieldset>)}
        {progress === items.length && <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300"><Check size={15} aria-hidden />Everything on the checklist is done.</p>}
      </Card>
    </div>
  );
}
