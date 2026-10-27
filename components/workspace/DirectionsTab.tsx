"use client";
import { useState } from "react";
import { ArrowRight, Check, Columns3, Eye, RefreshCw } from "lucide-react";
import { Badge, Button, Card, Dialog, Notice, SectionHead, SourceBadge, useToast } from "../ui";
import { updateProject } from "@/lib/store";
import { regenerateDirection } from "@/lib/engine/analyze";
import { uiStyleOf } from "@/lib/engine/uistyle";
import { useGoogleFonts } from "../FontLoader";
import { fontFamilyCss } from "@/lib/fonts";
import { DirectionPreview } from "./DirectionPreview";
import { Swatches, type TabProps } from "./shared";
import type { Direction } from "@/lib/types";
import { ROLES } from "@/lib/types";

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div><dt className="text-xs text-faint">{k}</dt><dd className="mt-0.5 text-[13px] leading-relaxed text-muted">{v}</dd></div>;

function Detail({ d, selected, onSelect, onClose, open }: { d: Direction | null; selected: boolean; onSelect: () => void; onClose: () => void; open: boolean }) {
  if (!d) return null;
  const ui = uiStyleOf(d);
  return (
    <Dialog open={open} onClose={onClose} title={d.name} wide>
      <DirectionPreview d={d} />
      <p className="mt-4 text-sm leading-relaxed text-muted">{d.summary}</p>
      <div className="mt-4"><Swatches d={d} h={28} /><p className="mt-1.5 font-mono text-[11px] text-faint">{ROLES.map((r) => d.palette.colors[r]).join(" ")}</p></div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <Row k="Typography" v={<>{d.fonts.heading} + {d.fonts.body}. {d.fontRationale}</>} />
        <Row k="UI style" v={<>Radius {ui.radius}px · {ui.density} density. {ui.buttons}. Motion: {ui.motion}.</>} />
        <Row k="Imagery" v={d.imageStyle} /><Row k="Illustration" v={d.illustrationStyle} />
        <Row k="Icons" v={d.iconStyle} /><Row k="Logo direction" v={d.logoDirection} />
        <Row k="Design principles" v={<ul className="list-disc space-y-0.5 pl-4">{d.principles.map((x) => <li key={x}>{x}</li>)}</ul>} />
        <Row k="UI inspiration" v={<ul className="list-disc space-y-0.5 pl-4">{d.uiInspiration.map((x) => <li key={x}>{x}</li>)}</ul>} />
        <Row k="Components to design first" v={d.components.join(" · ")} /><Row k="Brands to research" v={d.brandReferences.join(" · ")} />
      </dl>
      <div className="mt-6 flex flex-wrap justify-end gap-2"><Button onClick={onClose}>Close</Button><Button variant="primary" onClick={() => { onSelect(); onClose(); }} disabled={selected}>{selected ? <><Check size={15} aria-hidden />Selected</> : "Use this direction"}</Button></div>
    </Dialog>
  );
}

export function DirectionsTab({ project: p, goto }: TabProps) {
  const toast = useToast();
  const [compare, setCompare] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  useGoogleFonts(p.directions.flatMap((d) => [d.fonts.heading, d.fonts.body]), true);

  const select = (id: string) => { updateProject(p.id, (d) => { d.selectedDirection = id; d.status = d.status === "exploring" ? "ready" : d.status; }, `Selected direction: ${p.directions.find((x) => x.id === id)?.name}`); toast("Direction selected — typography, colors, components and export now use it"); };
  const regen = (id: string) => { updateProject(p.id, (proj) => { const i = proj.directions.findIndex((x) => x.id === id); proj.directions[i] = regenerateDirection(proj, id); proj.altPalettes = []; }, "Regenerated one direction"); toast("Direction regenerated (new hue and font pairing, generated locally)"); };

  const rows: [string, (d: Direction) => React.ReactNode][] = [
    ["Summary", (d) => d.summary], ["Heading font", (d) => d.fonts.heading], ["Body font", (d) => d.fonts.body], ["Layout", (d) => uiStyleOf(d).layout], ["Corner radius", (d) => `${uiStyleOf(d).radius}px`], ["Harmony", (d) => d.palette.harmony],
    ["Image style", (d) => d.imageStyle], ["Illustration", (d) => d.illustrationStyle], ["Icons", (d) => d.iconStyle], ["Logo direction", (d) => d.logoDirection],
    ["Principles", (d) => <ul className="list-disc space-y-1 pl-4">{d.principles.map((x) => <li key={x}>{x}</li>)}</ul>], ["Key components", (d) => d.components.join(" · ")], ["Brands to research", (d) => d.brandReferences.join(" · ")],
  ];
  const openDir = p.directions.find((d) => d.id === open) ?? null;

  return (
    <div className="rise">
      <SectionHead title="Creative directions" desc="Three different ways to answer the same brief. Explore each, then use one to steer typography, colors, components and exports." right={<><SourceBadge kind={p.source === "ai" ? "ai" : "local"} /><Button size="sm" onClick={() => setCompare(!compare)} aria-pressed={compare}><Columns3 size={14} aria-hidden />{compare ? "Card view" : "Compare"}</Button></>} />
      {p.source === "local" && <div className="mb-4"><Notice>These directions come from the built-in rule-based engine, not AI. They&rsquo;re still real starting points; regenerate or edit the analysis to refine them.</Notice></div>}
      {!compare ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {p.directions.map((d, i) => {
            const sel = p.selectedDirection === d.id;
            const ui = uiStyleOf(d);
            return (
              <Card key={d.id} className={`flex min-w-0 flex-col overflow-hidden ${sel ? "border-accent/60 ring-1 ring-accent/30" : ""}`}>
                <div className="p-3 pb-0"><DirectionPreview d={d} label={false} /></div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2"><div><span className="font-mono text-[11px] text-faint">Direction 0{i + 1}</span><h3 className="text-lg font-semibold tracking-tight">{d.name}</h3></div>{sel && <Badge tone="accent"><Check size={11} aria-hidden />Selected</Badge>}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{d.summary}</p>
                  <div className="mt-3"><Swatches d={d} h={20} /></div>
                  <dl className="mt-4 space-y-3 text-[13px]">
                    <div><dt className="text-xs text-faint">Typography</dt><dd className="mt-0.5 flex items-baseline gap-2"><span className="text-lg leading-none" style={{ fontFamily: fontFamilyCss(d.fonts.heading) }}>Aa</span><span className="text-muted">{d.fonts.heading} + {d.fonts.body}</span></dd></div>
                    <div><dt className="text-xs text-faint">UI style</dt><dd className="mt-1 flex flex-wrap gap-1">{ui.traits.map((t) => <Badge key={t}>{t}</Badge>)}</dd></div>
                    <div><dt className="text-xs text-faint">Mood</dt><dd className="mt-0.5 text-muted">{d.principles.slice(0, 2).join(" · ")}</dd></div>
                    <div><dt className="text-xs text-faint">Imagery</dt><dd className="mt-0.5 line-clamp-2 text-muted">{d.imageStyle}</dd></div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button className="flex-1" onClick={() => setOpen(d.id)}><Eye size={15} aria-hidden />Explore direction</Button>
                    <Button variant={sel ? "secondary" : "primary"} className="flex-1" onClick={() => select(d.id)} disabled={sel}>{sel ? <><Check size={15} aria-hidden />Selected</> : "Use this direction"}</Button>
                    <Button onClick={() => regen(d.id)} aria-label={`Regenerate ${d.name}`} title="Regenerate this direction only (generated locally)"><RefreshCw size={15} aria-hidden /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead><tr className="border-b border-line"><th className="w-32 p-3 text-left font-normal text-faint"><span className="sr-only">Attribute</span></th>{p.directions.map((d) => <th key={d.id} scope="col" className="p-3 text-left align-top"><div className="font-semibold">{d.name}</div><div className="mt-2"><Swatches d={d} h={16} /></div></th>)}</tr></thead>
            <tbody>
              {rows.map(([label, fn]) => <tr key={label} className="border-b border-line last:border-0"><th scope="row" className="p-3 text-left align-top font-normal text-faint">{label}</th>{p.directions.map((d) => <td key={d.id} className="p-3 align-top text-muted">{fn(d)}</td>)}</tr>)}
              <tr><th scope="row" className="p-3 text-left font-normal text-faint">Colors</th>{p.directions.map((d) => <td key={d.id} className="p-3 align-top font-mono text-[11px] text-muted">{ROLES.map((r) => <div key={r}>{r} {d.palette.colors[r]}</div>)}</td>)}</tr>
              <tr><th scope="row" className="p-3"><span className="sr-only">Actions</span></th>{p.directions.map((d) => <td key={d.id} className="p-3"><Button size="sm" variant="primary" onClick={() => select(d.id)} disabled={p.selectedDirection === d.id}>{p.selectedDirection === d.id ? "Selected ✓" : "Use this direction"}</Button></td>)}</tr>
            </tbody>
          </table>
        </Card>
      )}
      <div className="mt-5"><Notice>Brand names are <em>starting points to research</em>, not claims about their exact colors or fonts. Previews are illustrations built from each direction&rsquo;s real palette and fonts.</Notice></div>
      {p.selectedDirection && <div className="mt-5 flex justify-end"><Button variant="primary" onClick={() => goto("typography")}>Continue to typography<ArrowRight size={15} aria-hidden /></Button></div>}
      <Detail d={openDir} open={!!openDir} onClose={() => setOpen(null)} selected={!!openDir && p.selectedDirection === openDir.id} onSelect={() => openDir && select(openDir.id)} />
    </div>
  );
}
