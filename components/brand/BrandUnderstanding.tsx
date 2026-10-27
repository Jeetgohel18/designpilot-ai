"use client";
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Badge, Button, Card, Field, inputCls, Notice } from "../ui";
import { nameIdeas } from "@/lib/brand/concepts";
import type { BrandProfile } from "@/lib/brand/types";
import type { Project } from "@/lib/types";

/** Edits locally and commits on blur, so typing never re-renders the whole studio. Remount (key) to reset. */
function Text({ label, value, onCommit, rows, hint }: { label: string; value: string; onCommit: (v: string) => void; rows?: number; hint?: string }) {
  const [v, setV] = useState(value);
  return (
    <Field label={label}>
      {rows ? <textarea rows={rows} className={inputCls} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onCommit(v.trim())} />
        : <input className={inputCls} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v !== value && onCommit(v.trim())} />}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </Field>
  );
}
const toList = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 8);

export function BrandUnderstanding({ project: p, profile, onChange, onNext }: { project: Project; profile: BrandProfile; onChange: (patch: Partial<BrandProfile>, msg?: string) => void; onNext: () => void }) {
  const [seed, setSeed] = useState(0);
  const ideas = profile.nameIdeas;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Card className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold">Your brand, in your words</h3>
        <p className="mb-4 mt-1 text-[13px] text-muted">Prefilled from your brief. Edit anything: logo concepts are built from these answers, and nothing is invented about your competitors or what makes you different.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Text key={"n" + profile.name} label="Brand name" value={profile.name} onCommit={(v) => onChange({ name: v || profile.name }, "Brand name updated")} />
          <Text key={"i" + profile.industry} label="Industry" value={profile.industry} onCommit={(v) => onChange({ industry: v })} />
        </div>
        <div className="mt-3 grid gap-3"><Text key={"a" + profile.audience} label="Audience" value={profile.audience} onCommit={(v) => onChange({ audience: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Text key={"p" + profile.personality.join()} label="Personality (comma separated)" value={profile.personality.join(", ")} onCommit={(v) => onChange({ personality: toList(v) })} />
            <Text key={"v" + profile.values.join()} label="Values (comma separated)" value={profile.values.join(", ")} onCommit={(v) => onChange({ values: toList(v) })} />
            <Text key={"e" + profile.emotions.join()} label="Emotions to evoke" value={profile.emotions.join(", ")} onCommit={(v) => onChange({ emotions: toList(v) })} />
            <Text key={"t" + profile.tone} label="Tone of voice" value={profile.tone} onCommit={(v) => onChange({ tone: v })} />
          </div>
          <Text key={"po" + profile.positioning} label="Positioning" rows={3} value={profile.positioning} onCommit={(v) => onChange({ positioning: v })} />
          <Text key={"d" + profile.differentiators} label="What makes you different (your words)" rows={2} value={profile.differentiators} hint="Left blank on purpose. DesignPilot doesn't know your market and won't claim a difference for you." onCommit={(v) => onChange({ differentiators: v })} />
          <Text key={"c" + profile.competitors} label="How you differ from competitors (your words)" rows={2} value={profile.competitors} hint="Add only what you have checked yourself. The Similar references tab can help you find related products." onCommit={(v) => onChange({ competitors: v })} />
          <Text key={"co" + profile.constraints} label="Constraints" rows={2} value={profile.constraints} onCommit={(v) => onChange({ constraints: v })} />
        </div>
        <div className="mt-4 flex justify-end"><Button variant="primary" onClick={onNext}>Continue to logo concepts</Button></div>
      </Card>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Name ideas</h3><Badge tone="warn">Generated locally · unchecked</Badge></div>
          <p className="mt-1 text-[13px] text-muted">Combinations of words from your brief. They have <strong className="text-fg">not</strong> been checked for availability, domains or trademarks.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{ideas.map((n) => <button key={n} type="button" onClick={() => onChange({ name: n }, `Brand name set to ${n}`)} className="min-h-10 rounded-full border border-line px-3 text-sm hover:border-accent/50 hover:text-fg">{n}</button>)}</div>
          <div className="mt-3"><Button size="sm" onClick={() => { const next = nameIdeas(p, seed + 1); setSeed(seed + 1); onChange({ nameIdeas: next }); }}><Lightbulb size={14} aria-hidden />{ideas.length ? "Suggest others" : "Suggest names"}</Button></div>
        </Card>
        <Notice>Logo concepts are design starting points. DesignPilot can&rsquo;t tell you whether a mark is unique or free to register. Search existing logos and trademark registers before you commit.</Notice>
      </div>
    </div>
  );
}
