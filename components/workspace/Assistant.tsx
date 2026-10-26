"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Badge, inputCls } from "../ui";
import { updateProject } from "@/lib/store";
import { regeneratePalette, makePalette } from "@/lib/engine/palette";
import { ARCHETYPES } from "@/lib/engine/taxonomy";
import { hexToHsl } from "@/lib/color";
import type { Project } from "@/lib/types";
import type { AssistantAction } from "@/lib/engine/assistant";
import { regenerateDirection } from "@/lib/engine/analyze";

type Msg = { role: "user" | "assistant"; text: string; source?: "ai" | "local" };
const SUGGESTIONS = ["Which font pairing best suits this brand?", "Suggest three alternative color palettes", "Make the design direction more premium", "Explain why these colors work together", "Recommend suitable icons", "Suggest a better hero-section layout", "Create a developer-ready design brief", "Refine the current moodboard"];

export function Assistant({ project: p, goto, onClose }: { project: Project; goto: (t: string) => void; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", text: "Ask me about this project. I know your brief, analysis and selected direction. I can also act — e.g. generate alternative palettes or make the direction more premium." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  function apply(a: AssistantAction) {
    const d = p.directions.find((x) => x.id === p.selectedDirection) ?? p.directions[0];
    if (!d) return;
    if (a.type === "goto") goto(a.tab);
    if (a.type === "alt-palettes") { updateProject(p.id, (proj) => { const base = proj.directions.find((x) => x.id === d.id)!.palette; proj.altPalettes = [0, 1, 2].map(() => regeneratePalette(base)); }, "Assistant: generated 3 alternative palettes"); goto("colors"); }
    if (a.type === "regenerate-direction") updateProject(p.id, (proj) => { const i = proj.directions.findIndex((x) => x.id === a.directionId); proj.directions[i] = regenerateDirection(proj, a.directionId); }, "Assistant: regenerated direction");
    if (a.type === "more-premium") {
      updateProject(p.id, (proj) => {
        const x = proj.directions.find((y) => y.id === d.id)!;
        const { h, s } = hexToHsl(x.palette.colors.primary);
        const lux = ARCHETYPES.find((z) => z.id === "minimal-luxury")!;
        x.palette = { ...makePalette({ name: x.palette.name, hue: h, sat: Math.round(s * 0.65), scheme: "monochrome", tone: "warm", depth: "deep" }), mood: "Made more premium: lower saturation, deeper primary, warm neutral background, monochrome harmony." };
        x.fonts = { ...x.fonts, heading: lux.fonts.heading };
        x.principles = [...new Set(["Space is the luxury", ...x.principles])].slice(0, 5);
        x.iconStyle = lux.iconStyle;
      }, "Assistant: made direction more premium");
      goto("directions");
    }
  }

  async function send(text: string) {
    const t = text.trim(); if (!t || busy) return;
    setInput(""); setMsgs((m) => [...m, { role: "user", text: t }]); setBusy(true);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: t, project: { ...p, bookmarks: [], activity: [], moodboards: [] } }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Assistant unavailable");
      setMsgs((m) => [...m, { role: "assistant", text: data.reply, source: data.source }]);
      if (data.action) apply(data.action);
    } catch (e) { setMsgs((m) => [...m, { role: "assistant", text: e instanceof Error ? e.message : "Something went wrong. Try again." }]); } finally { setBusy(false); }
  }

  return (
    <aside className="flex h-full flex-col border-l border-line bg-surface" aria-label="Design assistant">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4"><span className="text-sm font-medium">Design assistant</span><button onClick={onClose} aria-label="Close assistant" className="rounded p-1 text-muted hover:bg-hover hover:text-fg">✕</button></div>
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-8 rounded-xl bg-accent-soft px-3 py-2 text-sm" : "mr-4 text-sm leading-relaxed text-muted"}>
            {m.text}{m.role === "assistant" && m.source && <span className="ml-2 align-middle"><Badge tone={m.source === "ai" ? "accent" : "neutral"}>{m.source === "ai" ? "AI" : "offline rules"}</Badge></span>}
          </div>
        ))}
        {busy && <div className="skeleton h-10 w-2/3 rounded-lg" />}
        <div ref={end} />
      </div>
      <div className="border-t border-line p-3">
        <div className="mb-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto scroll-thin">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} disabled={busy} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted hover:border-line-strong hover:text-fg disabled:opacity-50">{s}</button>)}</div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this project…" aria-label="Message" className={inputCls} maxLength={800} /><Button type="submit" variant="primary" disabled={busy || !input.trim()}>Send</Button></form>
      </div>
    </aside>
  );
}
