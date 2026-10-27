"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LayoutDashboard, Layers, Loader2, Briefcase, Fingerprint, PanelTop, Smartphone, ShoppingBag, Sparkles, Wand2 } from "lucide-react";
import { Button, Chip, Field, inputCls } from "./ui";
import { createProject } from "@/lib/store";
import { EXAMPLES, PROJECT_TYPES } from "@/lib/examples";
import { INDUSTRIES } from "@/lib/engine/taxonomy";
import type { ProjectSettings } from "@/lib/types";

const ICONS = { Smartphone, Layers, ShoppingBag, Briefcase, LayoutDashboard, PanelTop, Fingerprint } as const;
const PLATFORMS = ["Responsive website", "Mobile app (iOS / Android)", "Web app / dashboard", "Marketing landing page"];
const MIN = 15;

type Stage = "idle" | "analysing" | "saving" | "opening";

/** Stages mirror REAL events only: request sent -> waiting on the server (timer) -> response received -> project saved. */
function Progress({ stage, seconds }: { stage: Stage; seconds: number }) {
  const steps: [Stage, string][] = [["analysing", "Analysing your brief and drafting three creative directions"], ["saving", "Saving the project in this browser"], ["opening", "Opening your workspace"]];
  const idx = steps.findIndex(([s]) => s === stage);
  return (
    <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-line bg-surface p-4">
      <ol className="space-y-2.5">
        {steps.map(([s, label], i) => (
          <li key={s} className={`flex items-center gap-2.5 text-sm ${i > idx ? "text-faint" : i === idx ? "text-fg" : "text-muted"}`}>
            {i < idx ? <Check size={15} className="text-emerald-400" aria-hidden /> : i === idx ? <Loader2 size={15} className="animate-spin text-accent" aria-hidden /> : <span className="h-[15px] w-[15px] rounded-full border border-line-strong" aria-hidden />}
            <span>{label}{i === idx && s === "analysing" ? ` · ${seconds}s` : ""}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-faint">This is one request to the analysis service, so there is no percentage to show. If the AI is slow or unavailable, you&rsquo;ll get a clearly labelled local analysis instead of an error.</p>
    </div>
  );
}

export function BriefInput() {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [brief, setBrief] = useState("");
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ProjectSettings>({});
  const [stage, setStage] = useState<Stage>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const busy = stage !== "idle";
  const count = Object.values(settings).filter(Boolean).length;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dp:prefill");
      if (!raw) return;
      sessionStorage.removeItem("dp:prefill");
      const { brief: b, style } = JSON.parse(raw) as { brief: string; style?: string };
      // one-time sync from sessionStorage after mount (not available during SSR)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBrief(b); if (style) { setSettings({ style }); setOpen(true); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (stage !== "analysing") return;
    const t0 = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => { clearInterval(id); setSeconds(0); };
  }, [stage]);

  const set = (k: keyof ProjectSettings, v: string) => setSettings((s) => ({ ...s, [k]: v || undefined }));
  const fillBrief = (t: string) => { setBrief(t); setError(null); requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(t.length, t.length); }); };

  async function submit() {
    if (busy) return; // prevents duplicate submissions
    setError(null);
    const text = brief.trim();
    if (text.length < MIN) { setError(`Add a little more detail (at least ${MIN} characters): who it's for, what it does and how it should feel.`); ref.current?.focus(); return; }
    if (/\[[^\]]+\]/.test(text) && !confirmPlaceholders()) return;
    setStage("analysing");
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brief: text, settings }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The analysis service returned an error. Your brief is still here — try again.");
      setStage("saving");
      const p = createProject({ brief: text, settings, profile: data.profile, directions: data.directions, source: data.source });
      try { sessionStorage.setItem("dp:notice:" + p.id, data.notice ?? ""); } catch { /* ignore */ }
      setStage("opening");
      router.push(`/workspace?p=${p.id}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't reach the server. Check your connection — your brief is still here.");
      setStage("idle");
    }
  }
  const confirmPlaceholders = () => { setError("Replace the [bracketed] parts with your own details, then generate."); ref.current?.focus(); return false; };

  return (
    <div id="start" className="scroll-mt-24 text-left">
      <div className={`rounded-2xl border bg-surface shadow-2xl shadow-black/40 transition-colors focus-within:border-accent/60 ${error ? "border-red-400/40" : "border-line-strong"}`}>
        <label htmlFor="brief" className="sr-only">Describe your project</label>
        <textarea
          id="brief" ref={ref} value={brief} onChange={(e) => { setBrief(e.target.value); if (error) setError(null); }} rows={5} maxLength={2500} disabled={busy}
          aria-invalid={!!error} aria-describedby={error ? "brief-error" : "brief-help"}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
          placeholder="Describe your idea: what it is, who it's for, and how it should look and feel…"
          className="block w-full resize-none rounded-t-2xl bg-transparent px-4 pt-4 pb-2 text-base leading-relaxed text-fg placeholder:text-faint focus:outline-none sm:px-5 sm:pt-5 sm:text-[15px]"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="brief-details">
              <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />Add details{count ? ` · ${count}` : ""}
            </Button>
            <span id="brief-help" className="hidden text-xs text-faint sm:inline">{brief.trim().length < MIN ? `${Math.max(0, MIN - brief.trim().length)} more characters to start` : `${brief.length}/2500`}</span>
          </div>
          <Button variant="primary" size="lg" onClick={submit} disabled={busy} className="w-full sm:w-auto">
            {busy ? <><Loader2 size={16} className="animate-spin" aria-hidden />Working…</> : <><Sparkles size={16} aria-hidden />Generate design direction</>}
          </Button>
        </div>
        {open && (
          <div id="brief-details" className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
            <Field label="Target audience"><input className={inputCls} value={settings.audience ?? ""} onChange={(e) => set("audience", e.target.value)} placeholder="e.g. busy parents, Gen Z shoppers" /></Field>
            <Field label="Industry">
              <select className={inputCls} value={settings.industry ?? ""} onChange={(e) => set("industry", e.target.value)}><option value="">Detect automatically</option>{INDUSTRIES.filter((i) => i.id !== "general").map((i) => <option key={i.id}>{i.label}</option>)}</select>
            </Field>
            <Field label="Platform">
              <select className={inputCls} value={settings.platform ?? ""} onChange={(e) => set("platform", e.target.value)}><option value="">Detect automatically</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
            </Field>
            <Field label="Preferred aesthetic"><input className={inputCls} value={settings.style ?? ""} onChange={(e) => set("style", e.target.value)} placeholder="e.g. minimal, editorial, playful" /></Field>
            <div className="sm:col-span-2"><Field label="Design constraints"><textarea rows={2} className={inputCls} value={settings.constraints ?? ""} onChange={(e) => set("constraints", e.target.value)} maxLength={400} placeholder="e.g. must use our existing green, WCAG AA, launch in 6 weeks" /></Field></div>
            <Field label="Budget">
              <select className={inputCls} value={settings.budget ?? ""} onChange={(e) => set("budget", e.target.value)}><option value="">Not specified</option><option>Low — free / open-source first</option><option>Medium</option><option>High</option></select>
            </Field>
          </div>
        )}
      </div>
      {error && <p id="brief-error" role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {busy && <Progress stage={stage} seconds={seconds} />}

      {!busy && (
        <>
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-muted">Start from a project type</p>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((t) => { const I = ICONS[t.icon]; return (
                <button key={t.id} type="button" onClick={() => fillBrief(t.template)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"><I size={15} aria-hidden />{t.label}</button>
              ); })}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-faint">Or try a full example</span>
            {EXAMPLES.map((e) => <Chip key={e.label} onClick={() => fillBrief(e.text)}>{e.label}</Chip>)}
            <button type="button" onClick={() => fillBrief(EXAMPLES[0].text)} className="ml-1 inline-flex min-h-10 items-center gap-1 text-xs text-accent hover:underline sm:min-h-0"><Wand2 size={12} aria-hidden />Insert example brief</button>
          </div>
        </>
      )}
    </div>
  );
}
