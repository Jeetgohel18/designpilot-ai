"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

// ---------- Toasts ----------
const ToastCtx = createContext<(msg: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: "ok" | "error" }[]>([]);
  const push = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, msg, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`rise rounded-lg border px-3.5 py-2 text-sm shadow-xl shadow-black/40 ${i.tone === "error" ? "border-red-400/30 bg-[#2a1416] text-red-200" : "border-line-strong bg-elevated text-fg"}`}>{i.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch { return false; }
  }
}

export function useCopy() {
  const toast = useToast();
  return useCallback(async (text: string, label = "text") => {
    const ok = await copyText(text);
    toast(ok ? `Copied ${label} to clipboard` : "Couldn't copy — select and copy manually", ok ? "ok" : "error");
  }, [toast]);
}

export function download(filename: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Primitives ----------
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg" };
export function Button({ variant = "secondary", size = "md", className = "", ...p }: BtnProps) {
  const v = {
    primary: "bg-accent text-[#0b0a14] font-medium hover:bg-[#a094ff] disabled:hover:bg-accent",
    secondary: "border border-line-strong bg-elevated text-fg hover:bg-hover",
    ghost: "text-muted hover:text-fg hover:bg-hover",
    danger: "border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  }[variant];
  const s = { sm: "h-7 px-2.5 text-xs gap-1.5", md: "h-9 px-3.5 text-sm gap-2", lg: "h-11 px-5 text-sm gap-2" }[size];
  return <button type="button" {...p} className={`inline-flex shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${v} ${s} ${className}`} />;
}

export function CopyButton({ text, label = "Copy", what, size = "sm" }: { text: string; label?: string; what?: string; size?: "sm" | "md" }) {
  const copy = useCopy();
  const [done, setDone] = useState(false);
  return (
    <Button size={size} variant="secondary" onClick={async () => { await copy(text, what ?? "Text"); setDone(true); setTimeout(() => setDone(false), 1400); }} aria-label={`${label}${what ? ` ${what}` : ""}`}>
      {done ? "Copied ✓" : label}
    </Button>
  );
}

export function Badge({ tone = "neutral", children, title }: { tone?: "neutral" | "accent" | "ok" | "warn"; children: React.ReactNode; title?: string }) {
  const c = { neutral: "border-line text-muted", accent: "border-accent/30 bg-accent-soft text-[#b9b0ff]", ok: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300", warn: "border-amber-400/25 bg-amber-400/10 text-amber-200" }[tone];
  return <span title={title} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] leading-4 ${c}`}>{children}</span>;
}

/** Labels where a suggestion came from — required by product rules (never blur AI/curated/live). */
export function SourceBadge({ kind }: { kind: "ai" | "local" | "curated" | "live" | "search" | "estimate" }) {
  const map = {
    ai: ["accent", "AI-generated", "Produced by the configured AI model. A suggestion, not verified research."],
    local: ["neutral", "Generated locally", "Produced by DesignPilot's built-in rule-based engine. A suggestion, not verified research."],
    curated: ["neutral", "Curated", "Hand-picked by DesignPilot. Confirm licences on the source."],
    live: ["ok", "Live API", "Fetched live from the source's API."],
    search: ["neutral", "Search link", "Opens the source's own search results. DesignPilot has not verified individual results."],
    estimate: ["warn", "Estimate", "Visual estimate, not an official value."],
  } as const;
  const [tone, label, title] = map[kind];
  return <Badge tone={tone} title={title}>{label}</Badge>;
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-accent/50 bg-accent-soft text-[#cfc9ff]" : "border-line text-muted hover:border-line-strong hover:text-fg"}`}>{children}</button>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>;
}

export function SectionHead({ title, desc, right }: { title: string; desc?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {desc && <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted">{label}</span>{children}</label>;
}
export const inputCls = "w-full rounded-lg border border-line-strong bg-elevated px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-accent/60 focus:outline-none";

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={`rise w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border border-line-strong bg-surface p-5 shadow-2xl shadow-black/50 outline-none`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 id={id} className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted hover:bg-hover hover:text-fg">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onClose }: { open: boolean; title: string; body: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  return <div className={`rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed ${tone === "warn" ? "border-amber-400/25 bg-amber-400/5 text-amber-100/90" : "border-line bg-elevated text-muted"}`}>{children}</div>;
}
