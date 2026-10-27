"use client";
import { useMemo, useState } from "react";
import { Check, CircleHelp, ClipboardList, Copy, FileText, Lightbulb, Plus, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { Badge, Button, Card, Chip, ConfirmDialog, Dialog, EmptyState, Notice, SectionHead, inputCls, useToast } from "../ui";
import { updateProject } from "@/lib/store";
import { fromAiIdeas, localMore, makeIdea, seedFromAnalysis } from "@/lib/engine/brainstorm";
import { newId } from "@/lib/engine/palette";
import { IDEA_GROUPS, type Idea, type IdeaGroup, type Project } from "@/lib/types";
import type { TabProps } from "./shared";

const STATUS: Record<Idea["status"], { label: string; cls: string }> = {
  open: { label: "Open", cls: "border-l-line-strong" }, selected: { label: "Selected", cls: "border-l-accent" },
  rejected: { label: "Rejected", cls: "border-l-red-400/60 opacity-60" }, research: { label: "Needs research", cls: "border-l-amber-300/70" },
};
const GROUP_HELP: Record<IdeaGroup, string> = { Problems: "What could go wrong or frustrate people?", Opportunities: "Where could this stand out?", Features: "What could the product do?", "User needs": "What do people need to achieve?", "Visual ideas": "Look, feel and imagery", "Open questions": "What do we still need to find out?" };
const ORIGIN: Record<Idea["origin"], string> = { you: "You", analysis: "From analysis", ai: "AI", local: "Local suggestion" };

const ctx = (p: Project) => { const d = p.directions.find((x) => x.id === p.selectedDirection); return { brief: p.brief, summary: p.profile.summary, industry: p.profile.industry, audience: p.profile.audience, direction: d?.name, principles: d?.principles }; };

function Note({ idea, onChange, onDelete, onDuplicate, onRefine, onTask, onReq }: { idea: Idea; onChange: (patch: Partial<Idea>) => void; onDelete: () => void; onDuplicate: () => void; onRefine: () => void; onTask: () => void; onReq: () => void }) {
  const [edit, setEdit] = useState(false); const [v, setV] = useState(idea.text);
  const st = STATUS[idea.status];
  return (
    <li className={`group rounded-lg border border-line border-l-[3px] bg-elevated p-3 ${st.cls}`}>
      {edit ? (
        <div><textarea autoFocus aria-label="Edit idea" rows={3} maxLength={220} className={inputCls} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setV(idea.text); setEdit(false); } if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { onChange({ text: v.trim() || idea.text }); setEdit(false); } }} />
          <div className="mt-2 flex gap-2"><Button size="sm" variant="primary" onClick={() => { onChange({ text: v.trim() || idea.text }); setEdit(false); }}>Save</Button><Button size="sm" onClick={() => { setV(idea.text); setEdit(false); }}>Cancel</Button></div></div>
      ) : (
        <button className={`block w-full text-left text-[13px] leading-relaxed ${idea.status === "rejected" ? "line-through" : ""}`} onClick={() => setEdit(true)} aria-label={`Edit idea: ${idea.text}`}>{idea.text}</button>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5"><Badge>{ORIGIN[idea.origin]}</Badge>{idea.status !== "open" && <Badge tone={idea.status === "selected" ? "accent" : idea.status === "research" ? "warn" : "neutral"}>{st.label}</Badge>}</span>
        <span className="flex items-center">
          {([["selected", Check, "Select"], ["research", CircleHelp, "Needs research"], ["rejected", X, "Reject"]] as const).map(([s, I, l]) => (
            <button key={s} aria-pressed={idea.status === s} aria-label={`${l}${idea.status === s ? " (on)" : ""}`} title={l} onClick={() => onChange({ status: idea.status === s ? "open" : s })} className={`rounded p-2 hover:bg-hover ${idea.status === s ? "text-accent" : "text-faint hover:text-fg"}`}><I size={14} aria-hidden /></button>
          ))}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1 border-t border-line pt-2 text-faint">
        <button className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-hover hover:text-fg" onClick={onRefine}><Wand2 size={12} aria-hidden />Refine</button>
        <button className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-hover hover:text-fg" onClick={onTask}><ClipboardList size={12} aria-hidden />To task</button>
        <button className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-hover hover:text-fg" onClick={onReq}><FileText size={12} aria-hidden />To requirement</button>
        <button className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-hover hover:text-fg" onClick={onDuplicate} aria-label="Duplicate idea"><Copy size={12} aria-hidden />Duplicate</button>
        <button className="ml-auto inline-flex min-h-8 items-center gap-1 rounded px-1.5 text-[11px] hover:bg-hover hover:text-red-300" onClick={onDelete} aria-label="Delete idea"><Trash2 size={12} aria-hidden /></button>
      </div>
    </li>
  );
}

export function BrainstormTab({ project: p }: TabProps) {
  const toast = useToast();
  const bs = p.brainstorm ?? { ideas: [], tasks: [], requirements: [] };
  const [filter, setFilter] = useState<"all" | Idea["status"]>("all");
  const [drafts, setDrafts] = useState<Partial<Record<IdeaGroup, string>>>({});
  const [del, setDel] = useState<Idea | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refine, setRefine] = useState<{ idea: Idea; options: string[]; error?: string; loading: boolean } | null>(null);
  const [genGroup, setGenGroup] = useState<"" | IdeaGroup>("");

  const mutate = (fn: (b: NonNullable<Project["brainstorm"]>) => void, msg?: string) => updateProject(p.id, (x) => { x.brainstorm ??= { ideas: [], tasks: [], requirements: [] }; fn(x.brainstorm); }, msg);
  const existing = bs.ideas.map((i) => i.text);
  const shown = useMemo(() => bs.ideas.filter((i) => filter === "all" || i.status === filter), [bs.ideas, filter]);

  const add = (g: IdeaGroup) => { const t = (drafts[g] ?? "").trim(); if (!t) return; mutate((b) => { b.ideas.unshift(makeIdea(g, t)); }, `Added idea to ${g}`); setDrafts({ ...drafts, [g]: "" }); };
  const seed = () => { mutate((b) => { b.ideas.push(...seedFromAnalysis(p)); }, "Added example board from analysis"); toast("Example board created from your analysis — edit, reject or extend any note"); };

  async function generate() {
    setBusy("gen");
    try {
      const res = await fetch("/api/brainstorm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "generate", group: genGroup || undefined, existing, context: ctx(p) }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok && d.source !== "unavailable") throw new Error(d.error ?? "The brainstorm service returned an error.");
      if (d.source === "ai") { mutate((b) => { b.ideas.push(...fromAiIdeas(d.ideas)); }, "Generated ideas with AI"); toast(`Added ${d.ideas.length} AI ideas`); }
      else {
        const more = localMore(p, existing, genGroup || undefined);
        if (!more.length) { toast("No new local suggestions left for this group.", "error"); return; }
        mutate((b) => { b.ideas.push(...more); }, "Added local idea suggestions");
        toast(`${d.notice ?? "AI is unavailable."} Added ${more.length} local suggestions instead (labelled).`, "error");
      }
    } catch (e) { toast(e instanceof Error ? e.message : "Couldn't generate ideas. Your board is unchanged.", "error"); } finally { setBusy(null); }
  }

  async function openRefine(idea: Idea) {
    setRefine({ idea, options: [], loading: true });
    try {
      const res = await fetch("/api/brainstorm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "refine", group: idea.group, idea: idea.text, existing, context: ctx(p) }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d.source !== "ai") throw new Error(d.notice ?? d.error ?? "AI refinement is unavailable right now.");
      setRefine({ idea, options: d.ideas.map((i: { text: string }) => i.text), loading: false });
    } catch (e) { setRefine({ idea, options: [], loading: false, error: e instanceof Error ? e.message : "Couldn't refine this idea." }); }
  }

  const toTask = (i: Idea) => { mutate((b) => { b.tasks.push({ id: newId("task"), text: i.text, done: false, fromIdea: i.id }); }, "Created design task"); toast("Added to Design tasks"); };
  const toReq = (i: Idea) => { mutate((b) => { b.requirements.push({ id: newId("req"), text: i.text, fromIdea: i.id }); }, "Created design requirement"); toast("Added to Design requirements (included in exports)"); };

  return (
    <div className="rise">
      <SectionHead title="Brainstorming" desc="Capture and shape ideas before you design. Click a note to edit it. Mark ideas as selected, rejected or needing research, and turn the good ones into tasks and requirements." right={
        <>
          <select aria-label="Group for new ideas" className={`${inputCls} !w-auto`} value={genGroup} onChange={(e) => setGenGroup(e.target.value as "" | IdeaGroup)}><option value="">All groups</option>{IDEA_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
          <Button onClick={generate} disabled={busy === "gen"} variant="primary"><Sparkles size={15} aria-hidden />{busy === "gen" ? "Generating…" : "Generate more ideas"}</Button>
        </>} />
      <Notice>Your board is saved <strong>in this browser only</strong> (not in the cloud). AI ideas use Gemini when it&rsquo;s available; if it isn&rsquo;t, you get clearly labelled local suggestions drawn from your analysis. A failed request never changes your existing notes.</Notice>

      {bs.ideas.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<Lightbulb size={20} aria-hidden />} title="Your board is empty" action={<div className="flex flex-wrap justify-center gap-2"><Button variant="primary" onClick={seed}><Wand2 size={15} aria-hidden />Add example board from my analysis</Button><Button onClick={generate} disabled={busy === "gen"}>Generate ideas</Button></div>}>The example board is built from your real analysis (challenges, goals, needs and components). You can also add your own notes in any column below.</EmptyState></div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2"><span className="text-xs text-faint">Show</span>{(["all", "open", "selected", "research", "rejected"] as const).map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f === "all" ? `All (${bs.ideas.length})` : STATUS[f].label}</Chip>)}</div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {IDEA_GROUPS.map((g) => {
          const list = shown.filter((i) => i.group === g);
          return (
            <section key={g} aria-labelledby={`g-${g}`} className="min-w-0 rounded-xl border border-line bg-surface p-3">
              <div className="mb-2 flex items-baseline justify-between"><h3 id={`g-${g}`} className="text-sm font-semibold">{g} <span className="font-normal text-faint">· {list.length}</span></h3></div>
              <p className="mb-2 text-xs text-faint">{GROUP_HELP[g]}</p>
              <form onSubmit={(e) => { e.preventDefault(); add(g); }} className="mb-3 flex gap-1.5"><input aria-label={`Add to ${g}`} className={inputCls} placeholder="Add a note…" maxLength={220} value={drafts[g] ?? ""} onChange={(e) => setDrafts({ ...drafts, [g]: e.target.value })} /><Button type="submit" aria-label={`Add note to ${g}`}><Plus size={15} aria-hidden /></Button></form>
              <ul className="space-y-2">
                {list.map((i) => <Note key={i.id} idea={i}
                  onChange={(patch) => mutate((b) => { const t = b.ideas.find((x) => x.id === i.id); if (t) Object.assign(t, patch); })}
                  onDelete={() => setDel(i)}
                  onDuplicate={() => mutate((b) => { const idx = b.ideas.findIndex((x) => x.id === i.id); b.ideas.splice(idx + 1, 0, { ...i, id: newId("idea"), origin: "you", status: "open", createdAt: Date.now() }); }, "Duplicated idea")}
                  onRefine={() => openRefine(i)} onTask={() => toTask(i)} onReq={() => toReq(i)} />)}
                {list.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-faint">{bs.ideas.some((x) => x.group === g) ? "No notes match this filter." : "Nothing here yet."}</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><h3 className="mb-1 text-sm font-semibold">Design tasks <span className="font-normal text-faint">· {bs.tasks.filter((t) => t.done).length}/{bs.tasks.length} done</span></h3>
          {bs.tasks.length === 0 ? <p className="text-[13px] text-faint">Use “To task” on a note to turn it into something you can tick off.</p> : <ul className="mt-2 space-y-1">{bs.tasks.map((t) => <li key={t.id} className="flex items-start gap-2 text-[13px]"><label className="flex min-h-10 flex-1 cursor-pointer items-start gap-2 py-1.5"><input type="checkbox" checked={t.done} onChange={() => mutate((b) => { const x = b.tasks.find((y) => y.id === t.id); if (x) x.done = !x.done; })} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" /><span className={t.done ? "text-faint line-through" : ""}>{t.text}</span></label><button aria-label={`Remove task ${t.text}`} className="rounded p-2 text-faint hover:bg-hover hover:text-red-300" onClick={() => mutate((b) => { b.tasks = b.tasks.filter((y) => y.id !== t.id); })}><X size={14} aria-hidden /></button></li>)}</ul>}
        </Card>
        <Card className="p-4"><h3 className="mb-1 text-sm font-semibold">Design requirements <span className="font-normal text-faint">· {bs.requirements.length}</span></h3>
          {bs.requirements.length === 0 ? <p className="text-[13px] text-faint">Use “To requirement” on a note to record a decision. Requirements appear in the checklist export.</p> : <ul className="mt-2 space-y-1">{bs.requirements.map((r) => <li key={r.id} className="flex items-start justify-between gap-2 text-[13px]"><span className="py-2">{r.text}</span><button aria-label={`Remove requirement ${r.text}`} className="rounded p-2 text-faint hover:bg-hover hover:text-red-300" onClick={() => mutate((b) => { b.requirements = b.requirements.filter((y) => y.id !== r.id); })}><X size={14} aria-hidden /></button></li>)}</ul>}
        </Card>
      </div>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete this note?" body={del ? `“${del.text}” will be removed from the board.` : ""} confirmLabel="Delete note" onConfirm={() => del && mutate((b) => { b.ideas = b.ideas.filter((x) => x.id !== del.id); }, "Deleted idea")} />
      <Dialog open={!!refine} onClose={() => setRefine(null)} title="Refine this idea" wide>
        {refine && (<>
          <p className="rounded-lg bg-elevated p-3 text-[13px]"><span className="text-xs text-faint">Original</span><br />{refine.idea.text}</p>
          {refine.loading && <div className="mt-4 space-y-2" role="status" aria-live="polite"><div className="skeleton h-12 rounded-lg" /><div className="skeleton h-12 rounded-lg" /><p className="text-xs text-faint">Asking Gemini for clearer versions…</p></div>}
          {refine.error && <div className="mt-4"><Notice tone="warn">{refine.error} Your note is unchanged.</Notice></div>}
          {refine.options.length > 0 && <ul className="mt-4 space-y-2">{refine.options.map((o) => <li key={o} className="rounded-lg border border-line p-3 text-[13px]"><p>{o}</p><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="primary" onClick={() => { mutate((b) => { const t = b.ideas.find((x) => x.id === refine.idea.id); if (t) { t.text = o; t.origin = "ai"; } }, "Refined idea"); setRefine(null); toast("Idea updated"); }}>Replace note</Button><Button size="sm" onClick={() => { mutate((b) => { b.ideas.push({ ...makeIdea(refine.idea.group, o), origin: "ai" }); }, "Added refined idea"); toast("Added as a new note"); }}>Add as new note</Button></div></li>)}</ul>}
        </>)}
      </Dialog>
    </div>
  );
}
