"use client";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, RotateCcw, SlidersHorizontal, Star } from "lucide-react";
import { Badge, Button, Card, Chip, CopyButton, Notice } from "../ui";
import { Stage } from "./Stage";
import { ExportDialog } from "./ExportDialog";
import { buildCtx, componentCss, componentTsx, defaultCfg, defaultCustom, prettyHtml, stageVars, standaloneHtml, tokenRows, tokensCss, tokensJson, uniq, WIDTHS, type Custom, type ShadowLevel } from "@/lib/library";
import { BEHAVIOR_SOURCE } from "@/lib/library";
import { CATEGORY_LABEL, type Cfg, type Component } from "@/lib/library/types";
import type { Direction, Project } from "@/lib/types";

interface Props { project: Project; component: Component; direction: Direction; custom: Custom; setCustom: (c: Custom) => void; favorite: boolean; onFavorite: () => void; onBack: () => void; onFind: (q: string) => void }
type CodeTab = "html" | "markup" | "css" | "tsx" | "tokens" | "tokenscss" | "js";

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <span className="text-xs text-faint">{label}</span>
      <div className="inline-flex rounded-lg border border-line bg-elevated p-0.5">{options.map((o) => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={`min-h-9 rounded-md px-2.5 text-xs transition-colors sm:min-h-8 ${value === o.value ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}>{o.label}</button>)}</div>
    </div>
  );
}

export function ComponentDetail({ project, component: c, direction: d, custom, setCustom, favorite, onFavorite, onBack, onFind }: Props) {
  const [cfg, setCfg] = useState<Cfg>(() => defaultCfg(c));
  const [panel, setPanel] = useState(false);
  const [exp, setExp] = useState(false);
  const [code, setCode] = useState<CodeTab>("html");
  const stageRef = useRef<HTMLDivElement>(null);
  const ctx = useMemo(() => buildCtx(project, d, custom), [project, d, custom]);
  const vars = useMemo(() => stageVars(ctx, custom), [ctx, custom]);
  const html = useMemo(() => c.html(cfg, ctx), [c, cfg, ctx]);
  const variants = c.controls.find((x) => x.key === "variant");
  const base = defaultCustom(d);
  const dirty = JSON.stringify({ ...custom, width: 0, dark: 0 }) !== JSON.stringify({ ...base, width: 0, dark: 0 });
  const set = <K extends keyof Custom>(k: K, v: Custom[K]) => setCustom({ ...custom, [k]: v });
  const env = { project, component: c, cfg, ctx, custom };

  const codeText: Record<CodeTab, [string, string]> = {
    html: [standaloneHtml(c, cfg, ctx, custom), "Standalone HTML page (tokens + CSS + markup" + (c.interactive ? " + behavior script)" : ")")],
    markup: [prettyHtml(html), "Markup only"], css: [`${tokensCss(vars)}\n\n${componentCss(c)}`, "Tokens + component CSS"],
    tsx: [componentTsx(c, cfg, ctx), "React / TypeScript — static markup (type-checked)"], tokens: [tokensJson(vars), "Design tokens (W3C format)"], tokenscss: [tokensCss(vars), "CSS custom properties"], js: [BEHAVIOR_SOURCE(), "Behavior script used by the HTML page"],
  };
  const sizes = useMemo(() => {
    const out = [`Controls are at least ${cfg.size === "sm" ? 36 : cfg.size === "lg" ? 52 : 44}px tall on touch.`, `Corner radius ${custom.radius}px; border ${custom.border}px; density ${custom.sp}× (padding scales with it).`, `Headings in ${ctx.heading}; UI text in ${ctx.body} at weight ${custom.weight}.`, `Primary ${ctx.colors.primary} on ${ctx.colors.background}; text ${ctx.colors.text}.`];
    return out;
  }, [cfg.size, custom, ctx]);

  return (
    <div className="rise">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft size={15} aria-hidden />All components</Button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onFavorite} aria-pressed={favorite}><Star size={14} className={favorite ? "fill-current text-amber-300" : ""} aria-hidden />{favorite ? "Saved" : "Save"}</Button>
          <Button size="sm" onClick={() => onFind(`${c.name} UI design ${project.profile.industry}`)}>Find examples</Button>
          <Button size="sm" variant="primary" onClick={() => setExp(true)}><Download size={14} aria-hidden />Export</Button>
        </div>
      </div>
      <div className="mb-5"><div className="flex flex-wrap items-center gap-2"><Badge>{CATEGORY_LABEL[c.category]}</Badge>{c.interactive && <Badge tone="accent">Interactive</Badge>}</div><h2 className="mt-2 text-2xl font-semibold tracking-tight">{c.name}</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{c.desc}</p></div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {c.controls.map((ctl) => <Seg key={ctl.key} label={ctl.label} value={cfg[ctl.key]} options={ctl.options.length > 4 ? ctl.options.slice(0, 5) : ctl.options} onChange={(v) => setCfg({ ...cfg, [ctl.key]: v })} />)}
        <Seg label="Width" value={custom.width} options={[{ value: "mobile", label: "Mobile" }, { value: "tablet", label: "Tablet" }, { value: "desktop", label: "Full" }]} onChange={(v) => set("width", v)} />
        <Seg label="Theme" value={custom.dark ? "dark" : "light"} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} onChange={(v) => set("dark", v === "dark")} />
        <Button size="sm" onClick={() => setPanel(!panel)} aria-expanded={panel}><SlidersHorizontal size={14} aria-hidden />Customize{dirty ? " ●" : ""}</Button>
      </div>

      {panel && (
        <Card className="mb-3 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-muted">Radius: {custom.radius}px<input type="range" min={0} max={28} value={custom.radius} onChange={(e) => set("radius", +e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
            <label className="text-xs text-muted">Border: {custom.border}px<input type="range" min={0} max={3} value={custom.border} onChange={(e) => set("border", +e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
            <label className="text-xs text-muted">Spacing: {custom.sp}×<input type="range" min={0.75} max={1.5} step={0.05} value={custom.sp} onChange={(e) => set("sp", +e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
            <label className="text-xs text-muted">Font weight<select className="mt-1 w-full rounded-lg border border-line-strong bg-elevated px-2 py-2 text-sm text-fg" value={custom.weight} onChange={(e) => set("weight", +e.target.value)}>{[400, 500, 600, 700].map((w) => <option key={w}>{w}</option>)}</select></label>
            <label className="text-xs text-muted">Shadow<select className="mt-1 w-full rounded-lg border border-line-strong bg-elevated px-2 py-2 text-sm text-fg" value={custom.shadow} onChange={(e) => set("shadow", e.target.value as ShadowLevel)}>{["none", "soft", "medium", "hard"].map((w) => <option key={w}>{w}</option>)}</select></label>
            <label className="text-xs text-muted">Background<select className="mt-1 w-full rounded-lg border border-line-strong bg-elevated px-2 py-2 text-sm text-fg" value={custom.bg} onChange={(e) => set("bg", e.target.value as Custom["bg"])}><option value="direction">Direction background</option><option value="surface">Surface</option><option value="white">White</option><option value="dark">Dark</option><option value="transparent">Transparent</option></select></label>
            <label className="text-xs text-muted">Accent color<span className="mt-1 flex items-center gap-2"><input type="color" value={custom.accent ?? ctx.colors.primary} onChange={(e) => set("accent", e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line-strong bg-transparent" aria-label="Accent color" /><span className="font-mono text-[11px] text-faint">{custom.accent ?? "direction primary"}</span></span></label>
            <div className="flex items-end"><Button size="sm" onClick={() => setCustom({ ...base, width: custom.width, dark: custom.dark })} disabled={!dirty}><RotateCcw size={14} aria-hidden />Reset to direction</Button></div>
          </div>
          <p className="mt-3 text-xs text-faint">Defaults come from “{d.name}”. Changes update the preview and every export instantly.</p>
        </Card>
      )}

      <div className="scroll-thin overflow-x-auto rounded-xl border border-line-strong p-3 sm:p-4" style={{ background: "repeating-conic-gradient(#ffffff08 0% 25%, transparent 0% 50%) 50% / 16px 16px" }}>
        <Stage ref={stageRef} html={html} ctx={ctx} custom={custom} className="rounded-lg" minHeight={c.interactive ? 120 : 80} ariaLabel={`${c.name} preview`} />
      </div>
      <p className="mt-1.5 text-xs text-faint">{WIDTHS[custom.width] ? `Previewing at ${WIDTHS[custom.width]}px container width — components respond to their container.` : "Full width of this panel."} {c.interactive ? "Try it: this preview is interactive." : ""}</p>

      {variants && <section className="mt-8"><h3 className="mb-3 text-base font-semibold">Variants</h3><div className="grid gap-3 md:grid-cols-2">{variants.options.map((o, i) => <div key={o.value} className="min-w-0"><p className="mb-1.5 text-xs text-muted">{o.label}</p><Stage html={uniq(c.html({ ...cfg, variant: o.value }, ctx), i + 1)} ctx={ctx} custom={{ ...custom, width: "desktop" }} interactive={false} className="rounded-lg border border-line" padded forceWidth={false} /></div>)}</div></section>}
      {c.states && <section className="mt-8"><h3 className="mb-1 text-base font-semibold">States</h3><p className="mb-3 text-[13px] text-muted">Forced classes so every state is visible without interaction.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{c.states(ctx).map((s, i) => <div key={s.label} className="min-w-0"><p className="mb-1.5 text-xs text-muted">{s.label}</p><Stage html={uniq(s.html, 100 + i)} ctx={ctx} custom={{ ...custom, width: "desktop" }} interactive={false} className="rounded-lg border border-line" forceWidth={false} /></div>)}</div></section>}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold text-emerald-300">When to use</h3><ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted">{c.use.map((x) => <li key={x}>{x}</li>)}</ul></Card>
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold text-red-300">Avoid</h3><ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted">{c.avoid.map((x) => <li key={x}>{x}</li>)}</ul></Card>
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold">Accessibility</h3><ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted">{c.a11y.map((x) => <li key={x}>{x}</li>)}</ul></Card>
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold">Spacing, type, color & sizing</h3><ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted">{[...c.spacing, ...sizes].map((x) => <li key={x}>{x}</li>)}</ul></Card>
      </section>

      <section className="mt-8"><h3 className="mb-3 text-base font-semibold">Design tokens used</h3>
        <Card className="overflow-x-auto"><table className="w-full min-w-[420px] text-[13px]"><thead><tr className="border-b border-line text-left text-xs text-faint"><th className="p-3 font-normal">Token</th><th className="p-3 font-normal">Current value</th></tr></thead><tbody>{tokenRows(c, vars).map(([k, v]) => <tr key={k} className="border-b border-line last:border-0"><td className="p-3 font-mono text-xs">{k}</td><td className="p-3"><span className="flex items-center gap-2 font-mono text-xs text-muted">{/^#/.test(v) && <span className="h-4 w-4 shrink-0 rounded border border-line-strong" style={{ background: v }} />}<span className="break-all">{v}</span></span></td></tr>)}</tbody></table></Card>
      </section>
      <section className="mt-8"><h3 className="mb-2 text-base font-semibold">Implementation notes</h3><ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">{[...c.notes, "Pair the CSS with the token variables; the component reads only those variables.", "Container queries make the component respond to its parent width (wrap it in the .ds element)."].map((x) => <li key={x}>{x}</li>)}</ul></section>

      <section className="mt-8"><h3 className="mb-3 text-base font-semibold">Code</h3>
        <div className="mb-2 flex flex-wrap gap-1.5" role="tablist" aria-label="Code format">{([["html", "HTML page"], ["markup", "Markup"], ["css", "CSS"], ["tsx", "React (TSX)"], ["tokens", "Tokens JSON"], ["tokenscss", "Tokens CSS"], ...(c.interactive ? [["js", "Behavior JS"]] : [])] as [CodeTab, string][]).map(([k, l]) => <Chip key={k} active={code === k} onClick={() => setCode(k)}>{l}</Chip>)}</div>
        <Card><div className="flex items-center justify-between gap-2 border-b border-line p-2.5"><span className="text-xs text-muted">{codeText[code][1]}</span><CopyButton text={codeText[code][0]} label="Copy" what={code.toUpperCase()} /></div><pre className="scroll-thin max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-muted whitespace-pre-wrap break-words">{codeText[code][0]}</pre></Card>
        {code === "tsx" && <div className="mt-2"><Notice>Static markup only. Behavior (state, handlers) is not generated for React.</Notice></div>}
      </section>

      <ExportDialog open={exp} onClose={() => setExp(false)} project={project} component={c} cfg={cfg} ctx={ctx} custom={custom} getStage={() => stageRef.current} />
      <span className="hidden">{JSON.stringify(env).length}</span>
    </div>
  );
}
