"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Field, inputCls, Notice } from "./ui";
import { createProject } from "@/lib/store";
import { EXAMPLES } from "@/lib/examples";
import { INDUSTRIES } from "@/lib/engine/taxonomy";
import type { ProjectSettings } from "@/lib/types";


const PLATFORMS = ["Responsive website", "Mobile app (iOS / Android)", "Web app / dashboard", "Marketing landing page"];

export function BriefInput() {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [brief, setBrief] = useState("");
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ProjectSettings>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const set = (k: keyof ProjectSettings, v: string) => setSettings((s) => ({ ...s, [k]: v || undefined }));

  async function submit() {
    if (busy) return;
    setError(null);
    if (brief.trim().length < 15) { setError("Describe your project in at least a sentence — who it's for and how it should feel."); ref.current?.focus(); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brief, settings }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      const p = createProject({ brief: brief.trim(), settings, profile: data.profile, directions: data.directions, source: data.source });
      try { sessionStorage.setItem("dp:notice:" + p.id, data.notice ?? ""); } catch { /* ignore */ }
      router.push(`/workspace?p=${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div id="start" className="scroll-mt-24">
      <div className="rounded-2xl border border-line-strong bg-surface shadow-2xl shadow-black/40 focus-within:border-accent/50">
        <label htmlFor="brief" className="sr-only">Describe your project</label>
        <textarea
          id="brief" ref={ref} value={brief} onChange={(e) => setBrief(e.target.value)} rows={4} maxLength={2500} disabled={busy}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
          placeholder="Describe your project: what it is, who it's for, and how it should look and feel…"
          className="block w-full resize-none rounded-t-2xl bg-transparent px-5 pt-5 pb-2 text-[15px] leading-relaxed text-fg placeholder:text-faint focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
              Project settings{Object.values(settings).filter(Boolean).length ? ` · ${Object.values(settings).filter(Boolean).length}` : ""}
            </Button>
            <span className="hidden text-xs text-faint sm:inline">{brief.length}/2500</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-faint sm:inline"><kbd className="rounded border border-line px-1">⌘</kbd> <kbd className="rounded border border-line px-1">↵</kbd></span>
            <Button variant="primary" size="lg" onClick={submit} disabled={busy}>
              {busy ? (<><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0b0a14]/30 border-t-[#0b0a14]" />Analysing…</>) : "Generate Design Intelligence"}
            </Button>
          </div>
        </div>
        {open && (
          <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Industry">
              <select className={inputCls} value={settings.industry ?? ""} onChange={(e) => set("industry", e.target.value)}><option value="">Detect automatically</option>{INDUSTRIES.filter((i) => i.id !== "general").map((i) => <option key={i.id}>{i.label}</option>)}</select>
            </Field>
            <Field label="Target audience"><input className={inputCls} value={settings.audience ?? ""} onChange={(e) => set("audience", e.target.value)} placeholder="e.g. Gen Z shoppers" /></Field>
            <Field label="Platform">
              <select className={inputCls} value={settings.platform ?? ""} onChange={(e) => set("platform", e.target.value)}><option value="">Detect automatically</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
            </Field>
            <Field label="Style keywords"><input className={inputCls} value={settings.style ?? ""} onChange={(e) => set("style", e.target.value)} placeholder="e.g. minimal, editorial" /></Field>
            <Field label="Budget">
              <select className={inputCls} value={settings.budget ?? ""} onChange={(e) => set("budget", e.target.value)}><option value="">Not specified</option><option>Low — free / open-source first</option><option>Medium</option><option>High</option></select>
            </Field>
          </div>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-faint">Try an example</span>
        {EXAMPLES.map((e) => <Chip key={e.label} onClick={() => { setBrief(e.text); ref.current?.focus(); }}>{e.label}</Chip>)}
      </div>
      {busy && <div className="mt-4"><Notice>Reading your brief, matching industry and style signals, and building three directions. This usually takes a moment.</Notice></div>}
    </div>
  );
}
