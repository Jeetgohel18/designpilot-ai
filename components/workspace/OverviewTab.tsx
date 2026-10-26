"use client";
import { useState } from "react";
import { Button, Card, Field, inputCls, Notice, SectionHead, SourceBadge, useToast } from "../ui";
import { updateProject } from "@/lib/store";
import type { ProjectProfile } from "@/lib/types";
import type { TabProps } from "./shared";
import { INDUSTRIES } from "@/lib/engine/taxonomy";

const LISTS: [keyof ProjectProfile, string][] = [["userNeeds", "User needs"], ["businessGoals", "Business goals"], ["platforms", "Platforms & devices"], ["brandPersonality", "Brand personality"], ["visualMood", "Visual mood"], ["keywords", "Search keywords"], ["challenges", "Design challenges"]];
const TEXTS: [keyof ProjectProfile, string][] = [["projectType", "Project type"], ["industry", "Industry"], ["niche", "Niche"], ["audience", "Target audience"], ["designStyle", "Suggested design style"], ["typography", "Typography characteristics"], ["colorDirection", "Color direction"], ["imageDirection", "Image & illustration direction"]];

export function OverviewTab({ project: p, goto }: TabProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const setText = (k: keyof ProjectProfile, v: string) => { updateProject(p.id, (d) => { (d.profile as unknown as Record<string, unknown>)[k] = v; }); setDirty(true); };
  const setList = (k: keyof ProjectProfile, v: string) => { updateProject(p.id, (d) => { (d.profile as unknown as Record<string, unknown>)[k] = v.split("\n").map((s) => s.trim()).filter(Boolean); }); setDirty(true); };

  async function regenerate() {
    setBusy(true);
    try {
      const industry = INDUSTRIES.find((i) => i.label.toLowerCase() === p.profile.industry.toLowerCase())?.label;
      const res = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        brief: p.brief,
        settings: { ...p.settings, industry: industry ?? p.settings.industry, audience: p.profile.audience, style: p.profile.visualMood.join(", ") },
      }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateProject(p.id, (d) => { d.directions = data.directions; d.selectedDirection = null; d.source = data.source; d.altPalettes = []; }, "Regenerated directions from edited analysis");
      setDirty(false);
      toast("Directions regenerated from your edits — your edited analysis was kept");
      goto("directions");
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't regenerate", "error"); } finally { setBusy(false); }
  }

  return (
    <div className="rise">
      <SectionHead title="Project analysis" desc="Everything below is editable. Change what's wrong, then regenerate the directions from your edits." right={<SourceBadge kind={p.source === "ai" ? "ai" : "local"} />} />
      <Card className="p-5">
        <p className="text-[15px] leading-relaxed">{p.profile.summary}</p>
        <details className="mt-3 text-sm text-muted"><summary className="cursor-pointer text-faint hover:text-fg">Original brief</summary><p className="mt-2 leading-relaxed">{p.brief}</p></details>
      </Card>
      {p.source === "local" && <div className="mt-4"><Notice>This analysis was produced by DesignPilot&rsquo;s rule-based engine (keyword and industry matching), not an AI model. It&rsquo;s a fast starting point; edit anything that misses the mark.</Notice></div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {TEXTS.map(([k, label]) => (
          <Field key={k} label={label}>
            {String(p.profile[k]).length > 70 ? <textarea rows={3} className={inputCls} value={String(p.profile[k])} onChange={(e) => setText(k, e.target.value)} /> : <input className={inputCls} value={String(p.profile[k])} onChange={(e) => setText(k, e.target.value)} />}
          </Field>
        ))}
        {LISTS.map(([k, label]) => (
          <Field key={k} label={`${label} (one per line)`}><textarea rows={Math.min(6, Math.max(3, (p.profile[k] as string[]).length))} className={inputCls} value={(p.profile[k] as string[]).join("\n")} onChange={(e) => setList(k, e.target.value)} /></Field>
        ))}
      </div>
      <div className="sticky bottom-3 mt-6 flex items-center justify-between gap-3 rounded-xl border border-line-strong bg-elevated/95 p-3 shadow-xl shadow-black/40 backdrop-blur">
        <p className="text-sm text-muted">{dirty ? "You've edited the analysis." : "Edit any field to refine the recommendations."}</p>
        <Button variant="primary" onClick={regenerate} disabled={busy}>{busy ? "Regenerating…" : "Regenerate directions from edits"}</Button>
      </div>
    </div>
  );
}
