"use client";
import { useState } from "react";
import { Badge, Button, Card, Notice, SectionHead, SourceBadge, useToast } from "../ui";
import { updateProject } from "@/lib/store";
import { regenerateDirection } from "@/lib/engine/analyze";
import { fontFamilyCss } from "@/lib/fonts";
import { useGoogleFonts } from "../FontLoader";
import { Swatches, type TabProps } from "./shared";
import type { Direction } from "@/lib/types";
import { ROLES } from "@/lib/types";

function Specimen({ d }: { d: Direction }) {
  const c = d.palette.colors;
  return (
    <div className="rounded-lg border border-line p-4" style={{ background: c.background, color: c.text }}>
      <p className="text-2xl leading-tight" style={{ fontFamily: fontFamilyCss(d.fonts.heading), color: c.text }}>Considered by design</p>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ fontFamily: fontFamilyCss(d.fonts.body), opacity: 0.8 }}>{d.fonts.heading} / {d.fonts.body}</p>
      <div className="mt-3 flex gap-2"><span className="rounded-md px-2.5 py-1 text-xs" style={{ background: c.primary, color: c.background }}>Primary</span><span className="rounded-md border px-2.5 py-1 text-xs" style={{ borderColor: c.border, background: c.surface }}>Secondary</span><span className="rounded-md px-2.5 py-1 text-xs" style={{ background: c.accent, color: c.text }}>Accent</span></div>
    </div>
  );
}

export function DirectionsTab({ project: p, goto }: TabProps) {
  const toast = useToast();
  const [compare, setCompare] = useState(false);
  useGoogleFonts(p.directions.flatMap((d) => [d.fonts.heading, d.fonts.body]), true);

  const select = (id: string) => { updateProject(p.id, (d) => { d.selectedDirection = id; d.status = d.status === "exploring" ? "ready" : d.status; }, `Selected direction: ${p.directions.find((x) => x.id === id)?.name}`); toast("Direction selected — references, moodboards and handoff now use it"); };
  const regen = (id: string) => { updateProject(p.id, (proj) => { const i = proj.directions.findIndex((x) => x.id === id); proj.directions[i] = regenerateDirection(proj, id); proj.altPalettes = []; }, "Regenerated one direction"); toast("Direction regenerated"); };

  const rows: [string, (d: Direction) => React.ReactNode][] = [
    ["Summary", (d) => d.summary], ["Heading font", (d) => d.fonts.heading], ["Body font", (d) => d.fonts.body], ["Harmony", (d) => d.palette.harmony],
    ["Image style", (d) => d.imageStyle], ["Illustration", (d) => d.illustrationStyle], ["Icons", (d) => d.iconStyle], ["Logo direction", (d) => d.logoDirection],
    ["UI inspiration", (d) => <ul className="list-disc space-y-1 pl-4">{d.uiInspiration.map((x) => <li key={x}>{x}</li>)}</ul>],
    ["Principles", (d) => <ul className="list-disc space-y-1 pl-4">{d.principles.map((x) => <li key={x}>{x}</li>)}</ul>],
    ["Key components", (d) => d.components.join(" · ")], ["Brands to research", (d) => d.brandReferences.join(" · ")],
  ];

  return (
    <div className="rise">
      <SectionHead title="Three creative directions" desc="Distinct starting points for the same brief. Select one to steer references, assets, moodboards and the developer handoff." right={<><SourceBadge kind={p.source === "ai" ? "ai" : "local"} /><Button size="sm" onClick={() => setCompare(!compare)} aria-pressed={compare}>{compare ? "Card view" : "Compare side by side"}</Button></>} />
      {!compare ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {p.directions.map((d, i) => {
            const sel = p.selectedDirection === d.id;
            return (
              <Card key={d.id} className={`flex flex-col p-4 ${sel ? "border-accent/60 shadow-[0_0_0_1px_rgba(139,124,255,.35)]" : ""}`}>
                <div className="mb-3 flex items-center justify-between"><span className="font-mono text-xs text-faint">0{i + 1}</span>{sel && <Badge tone="accent">Selected</Badge>}</div>
                <Specimen d={d} />
                <div className="mt-3"><Swatches d={d} h={22} /></div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{d.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{d.summary}</p>
                <dl className="mt-4 space-y-3 text-[13px]">
                  <div><dt className="text-faint">Typography</dt><dd className="mt-0.5">{d.fonts.heading} + {d.fonts.body}</dd></div>
                  <div><dt className="text-faint">Imagery</dt><dd className="mt-0.5 text-muted">{d.imageStyle}</dd></div>
                  <div><dt className="text-faint">Logo direction</dt><dd className="mt-0.5 text-muted">{d.logoDirection}</dd></div>
                  <div><dt className="text-faint">Principles</dt><dd className="mt-1 flex flex-wrap gap-1">{d.principles.map((x) => <Badge key={x}>{x}</Badge>)}</dd></div>
                </dl>
                <div className="mt-auto flex gap-2 pt-5">
                  <Button variant={sel ? "secondary" : "primary"} className="flex-1" onClick={() => select(d.id)} disabled={sel}>{sel ? "Selected ✓" : "Select direction"}</Button>
                  <Button onClick={() => regen(d.id)} aria-label={`Regenerate ${d.name}`} title="Regenerate this direction only">↻</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead><tr className="border-b border-line"><th className="w-32 p-3 text-left font-normal text-faint"> </th>{p.directions.map((d) => <th key={d.id} className="p-3 text-left align-top"><div className="font-semibold">{d.name}</div><div className="mt-2"><Swatches d={d} h={16} /></div></th>)}</tr></thead>
            <tbody>
              {rows.map(([label, fn]) => <tr key={label} className="border-b border-line last:border-0"><th scope="row" className="p-3 text-left align-top font-normal text-faint">{label}</th>{p.directions.map((d) => <td key={d.id} className="p-3 align-top text-muted">{fn(d)}</td>)}</tr>)}
              <tr><th scope="row" className="p-3 text-left font-normal text-faint">Colors</th>{p.directions.map((d) => <td key={d.id} className="p-3 align-top font-mono text-[11px] text-muted">{ROLES.map((r) => <div key={r}>{r} {d.palette.colors[r]}</div>)}</td>)}</tr>
              <tr><th /> {p.directions.map((d) => <td key={d.id} className="p-3"><Button size="sm" variant="primary" onClick={() => select(d.id)} disabled={p.selectedDirection === d.id}>{p.selectedDirection === d.id ? "Selected ✓" : "Select"}</Button></td>)}</tr>
            </tbody>
          </table>
        </Card>
      )}
      <div className="mt-5"><Notice>Brand names are <em>starting points to research</em>, not claims about their exact colors or fonts. Look up each brand&rsquo;s official guidelines in the Brand tab.</Notice></div>
      {p.selectedDirection && <div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => goto("typography")}>Continue to typography →</Button></div>}
    </div>
  );
}
