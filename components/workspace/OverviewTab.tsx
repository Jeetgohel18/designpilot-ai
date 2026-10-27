"use client";
import { useState } from "react";
import { ArrowRight, Compass, Layers, ListChecks, Target, TriangleAlert, Users } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, Notice, SourceBadge, useToast } from "../ui";
import { updateProject } from "@/lib/store";
import { starterSet } from "@/lib/engine/starterkit";
import { AnalysisEditor } from "./AnalysisEditor";
import type { TabProps } from "./shared";

function Block({ icon, title, children, className = "" }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-medium text-muted"><span className="text-accent" aria-hidden>{icon}</span>{title}</h3>
      {children}
    </Card>
  );
}
const List = ({ items }: { items: string[] }) => <ul className="space-y-1.5 text-[13px] leading-relaxed">{items.map((x) => <li key={x} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden />{x}</li>)}</ul>;

export function OverviewTab(props: TabProps) {
  const { project: p, direction: d, goto } = props;
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const pr = p.profile;
  const set = starterSet(p);

  async function reanalyse() {
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brief: p.brief, settings: p.settings }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      updateProject(p.id, (x) => { x.profile = data.profile; x.directions = data.directions; x.selectedDirection = null; x.source = data.source; x.altPalettes = []; }, `Re-ran analysis (${data.source === "ai" ? "AI" : "local fallback"})`);
      try { sessionStorage.setItem("dp:notice:" + p.id, data.notice ?? ""); } catch { /* ignore */ }
      toast(data.source === "ai" ? "Analysis updated with AI" : "Analysis updated using the local fallback", data.source === "ai" ? "ok" : "error");
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't re-run the analysis. Your existing analysis is unchanged.", "error"); } finally { setBusy(false); }
  }

  const next = !p.selectedDirection
    ? { text: "Choose the creative direction you want to develop.", cta: "Compare directions", go: "directions" }
    : { text: "Direction chosen. Turn it into screens, components and a checklist.", cta: "Start designing", go: "start" };

  return (
    <div className="rise space-y-6">
      <div>
        <h1 className="sr-only">Overview</h1>
        <div className="flex flex-wrap items-center gap-2"><SourceBadge kind={p.source === "ai" ? "ai" : "local"} /><span className="text-xs text-faint">{pr.projectType} · {pr.industry}</span></div>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed sm:text-xl">{pr.summary}</p>
      </div>

      {p.source === "local" && (
        <Notice tone="warn"><span className="flex items-start gap-2"><TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden /><span><strong>Fallback result.</strong> This analysis was produced by DesignPilot&rsquo;s built-in rule-based engine (keyword and industry matching), not by AI. It&rsquo;s a fast starting point. Edit anything below, or re-run when AI is available.</span></span></Notice>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="brief-edit" className="text-[13px] font-medium text-muted">Your brief</label><Button size="sm" onClick={() => setConfirm(true)} disabled={busy}>{busy ? "Analysing…" : "Re-run analysis from this brief"}</Button></div>
        <textarea id="brief-edit" rows={3} maxLength={2500} value={p.brief} onChange={(e) => updateProject(p.id, (x) => { x.brief = e.target.value; })} className="mt-2 w-full resize-y rounded-lg border border-line-strong bg-elevated px-3 py-2 text-sm leading-relaxed focus:border-accent/60 focus:outline-none" />
        <p className="mt-1.5 text-xs text-faint">Edits save automatically in this browser. Re-running replaces the analysis and directions.</p>
      </Card>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${p.selectedDirection ? "border-line bg-surface" : "border-accent/40 bg-accent-soft"}`}>
        <div className="flex items-start gap-3"><Compass size={18} className="mt-0.5 text-accent" aria-hidden /><div><p className="text-sm font-medium">Next step</p><p className="text-[13px] text-muted">{next.text}</p></div></div>
        <Button variant="primary" onClick={() => goto(next.go)}>{next.cta}<ArrowRight size={15} aria-hidden /></Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Block icon={<Users size={16} />} title="Target audience"><p className="text-[13px] leading-relaxed">{pr.audience}</p><p className="mt-2 text-xs text-faint">Platforms</p><p className="text-[13px] text-muted">{pr.platforms.join(" · ")}</p></Block>
        <Block icon={<Users size={16} />} title="Key user needs"><List items={pr.userNeeds} /></Block>
        <Block icon={<Target size={16} />} title="Product goals"><List items={pr.businessGoals} /></Block>
        <Block icon={<TriangleAlert size={16} />} title="Main UX challenges"><List items={pr.challenges} /></Block>
        <Block icon={<Compass size={16} />} title="Recommended visual personality"><div className="flex flex-wrap gap-1.5">{pr.brandPersonality.map((x) => <Badge key={x} tone="accent">{x}</Badge>)}</div><p className="mt-3 text-xs text-faint">Visual mood</p><p className="text-[13px] text-muted">{pr.visualMood.join(", ")}</p><p className="mt-3 text-xs text-faint">Suggested style</p><p className="text-[13px] text-muted">{pr.designStyle}</p></Block>
        <Block icon={<Layers size={16} />} title={`Design principles${d ? ` · ${d.name}` : ""}`}>{d ? <List items={d.principles} /> : <p className="text-[13px] text-muted">Select a direction to see its principles.</p>}</Block>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Block icon={<Layers size={16} />} title="Recommendations from the analysis">
          <dl className="space-y-3 text-[13px]">
            <div><dt className="text-xs text-faint">Typography</dt><dd className="mt-0.5 text-muted">{pr.typography}</dd></div>
            <div><dt className="text-xs text-faint">Color</dt><dd className="mt-0.5 text-muted">{pr.colorDirection}</dd></div>
            <div><dt className="text-xs text-faint">Imagery</dt><dd className="mt-0.5 text-muted">{pr.imageDirection}</dd></div>
          </dl>
        </Block>
        <Block icon={<ListChecks size={16} />} title="Likely screens to design">
          <div className="mb-2 flex flex-wrap items-center gap-2"><Badge title="Curated by DesignPilot for this type of project; not part of your brief analysis">Suggested for {set.label} projects</Badge></div>
          <ul className="space-y-1.5 text-[13px]">{set.screens.slice(0, 6).map((s) => <li key={s.id}><span className="font-medium">{s.name}</span><span className="text-muted"> — {s.purpose}</span></li>)}</ul>
          <Button size="sm" className="mt-3" onClick={() => goto("start")}>See the starter kit<ArrowRight size={14} aria-hidden /></Button>
        </Block>
      </div>

      <details className="group rounded-xl border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium"><span>Edit the full analysis</span><span className="text-xs text-faint group-open:hidden">Show</span><span className="hidden text-xs text-faint group-open:inline">Hide</span></summary>
        <div className="border-t border-line p-4"><AnalysisEditor {...props} /></div>
      </details>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Re-run the analysis?" body="This replaces the current analysis, directions and your direction selection with a fresh result from your brief. Moodboards, bookmarks and brainstorm ideas are kept." confirmLabel="Re-run analysis" onConfirm={reanalyse} />
    </div>
  );
}
