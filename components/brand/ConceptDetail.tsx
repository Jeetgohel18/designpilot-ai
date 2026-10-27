"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Download, Loader2, Pin, Shuffle } from "lucide-react";
import { Badge, Button, Card, Chip, Notice, useToast } from "../ui";
import { LogoView, VecView } from "./LogoView";
import { describe } from "@/lib/brand/concepts";
import { logoName, logoPdf, logoRaster, logoSvg, LAYOUT_LABEL, VARIANT_LABEL } from "@/lib/brand/export";
import { clearSpace, MOCKUPS, mockup } from "@/lib/brand/mockups";
import { MOTIFS } from "@/lib/brand/motifs";
import { ARCH, minSizes, renderLogo, schemeCols, type Fonts } from "@/lib/brand/render";
import type { ConceptSpec, Layout, Scheme } from "@/lib/brand/types";
import { contrast } from "@/lib/color";
import { saveBlob } from "@/lib/download";
import { outlined, vecRaster } from "@/lib/brand/export";
import { slugOf } from "@/lib/brand/kit";
import type { BrandProfile } from "@/lib/brand/types";
import type { Direction } from "@/lib/types";

interface Props { spec: ConceptSpec; profile: BrandProfile; direction: Direction; fonts: Fonts | null; fontsError: boolean; selected: boolean; onChange: (s: ConceptSpec) => void; onBack: () => void; onSelect: () => void; onPin: () => void; onMoodboard: () => void; onSavePalette: () => void; onSaveFonts: () => void; onKit: () => void; goto: (tab: string) => void }
type Format = "png" | "jpeg" | "svg" | "pdf";
const LAYOUTS: Layout[] = ["primary", "horizontal", "stacked", "symbol", "wordmark"];
const SCHEMES: Scheme[] = ["full", "reversed", "black", "white"];
const WIDTHS = [256, 512, 1024, 2048, 4096];
const previewBg = (s: Scheme) => (s === "white" ? "#1b1b22" : s === "reversed" ? "transparent" : "#ffffff");

const Sec = ({ title, children, desc }: { title: string; desc?: string; children: React.ReactNode }) => <section className="mt-6"><h3 className="text-base font-semibold">{title}</h3>{desc && <p className="mb-3 mt-0.5 text-[13px] text-muted">{desc}</p>}<div className={desc ? "" : "mt-3"}>{children}</div></section>;
const Pair = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="rounded-lg border border-line p-3"><p className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</p><p className="mt-1 text-[13px] leading-relaxed text-muted">{children}</p></div>;

export function ConceptDetail({ spec, profile, direction: d, fonts, fontsError, selected, onChange, onBack, onSelect, onPin, onMoodboard, onSavePalette, onSaveFonts, onKit, goto }: Props) {
  const toast = useToast();
  const [layout, setLayout] = useState<Layout>("primary");
  const [scheme, setScheme] = useState<Scheme>("full");
  const [format, setFormat] = useState<Format>("png");
  const [width, setWidth] = useState(2048);
  const [bg, setBg] = useState<"transparent" | "white" | "black" | "brand">("transparent");
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const a = useMemo(() => describe(spec, profile), [spec, profile]);
  const base = useMemo(() => renderLogo(spec, "primary", "full", fonts ?? undefined), [spec, fonts]);
  const mins = minSizes(base);
  const c = d.palette.colors;
  const colorOpts = [...new Set([spec.palette.ink, c.primary, c.secondary, c.accent, c.text])];
  const accentOpts = [...new Set([spec.palette.accent, c.accent, c.secondary, c.primary])];
  const bgHex = bg === "white" ? "#ffffff" : bg === "black" ? "#000000" : bg === "brand" ? spec.palette.bg : null;
  const jpeg = format === "jpeg";
  const effectiveBg = jpeg ? bgHex ?? "#ffffff" : bgHex;

  async function run() {
    if (!fonts) return;
    setBusy(true); setResult(null);
    try {
      if (format === "svg") { const x = logoSvg(spec, layout, scheme, fonts); saveBlob(x.name, x.svg, "image/svg+xml"); setResult({ kind: "ok", text: `Saved ${x.name}: vector artwork with outlined lettering (${x.vec.w}×${x.vec.h} units).` }); }
      else if (format === "pdf") { const x = await logoPdf(spec, profile, d, fonts); saveBlob(x.name, x.bytes as BlobPart, "application/pdf"); setResult({ kind: "ok", text: `Saved ${x.name}: presentation sheet with selectable text.` }); }
      else { const x = await logoRaster(spec, layout, scheme, fonts, { format, width, background: effectiveBg, quality: quality / 100 }); saveBlob(x.name, x.blob); setResult({ kind: "ok", text: `Saved ${x.name} (${x.width}×${x.height}px${format === "png" && !effectiveBg ? ", transparent background" : ""}).` }); }
      toast("Download started");
    } catch (e) { setResult({ kind: "error", text: e instanceof Error ? e.message : "The export failed." }); }
    finally { setBusy(false); }
  }
  async function saveMockup(id: (typeof MOCKUPS)[number]["id"]) {
    if (!fonts) return;
    try { const r = await vecRaster(outlined(mockup(id, spec, fonts), fonts), { format: "png", width: 1600, background: null }); saveBlob(`${slugOf(spec.name)}-${id}-mockup.png`, r.blob); toast("Download started"); } catch (e) { toast(e instanceof Error ? e.message : "Export failed", "error"); }
  }
  const set = (patch: Partial<ConceptSpec>) => onChange({ ...spec, ...patch });
  const showFonts = fonts ?? null;
  const inkWarn = contrast(spec.palette.ink, spec.palette.bg) < 3;
  const motifBased = spec.archetype === "geometric" || spec.archetype === "combo";
  const darkPreview = scheme === "white";
  const fname = format === "svg" ? logoName(spec, layout, scheme, "svg") : format === "pdf" ? "…-presentation.pdf" : logoName(spec, layout, scheme, format === "png" ? "png" : "jpg", `-${width}px`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:bg-hover hover:text-fg"><ArrowLeft size={15} aria-hidden />All concepts</button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onPin} aria-pressed={!!spec.pinned}><Pin size={14} aria-hidden />{spec.pinned ? "Pinned" : "Pin"}</Button>
          <Button size="sm" onClick={onMoodboard}>Add to moodboard</Button>
          <Button size="sm" variant={selected ? "secondary" : "primary"} onClick={onSelect}>{selected ? <><Check size={14} aria-hidden />Selected logo</> : "Use as my logo"}</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{spec.name}</h2><Badge tone="accent">{ARCH[spec.archetype].label}</Badge><Badge tone="warn">Generated concept</Badge></div>
      <p className="mt-1 text-[13px] text-muted">{a.idea}</p>
      {fontsError && <div className="mt-3"><Notice tone="warn">The logo font couldn&rsquo;t be loaded, so lettering below is a preview only and exports are disabled until it loads. Check your connection and reopen this concept.</Notice></div>}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lockup">{LAYOUTS.map((l) => <Chip key={l} active={layout === l} onClick={() => setLayout(l)}>{LAYOUT_LABEL[l]}</Chip>)}</div>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Colour version">{SCHEMES.map((s) => <Chip key={s} active={scheme === s} onClick={() => setScheme(s)}>{VARIANT_LABEL[s]}</Chip>)}</div>
          <div className="mt-3 flex min-h-56 items-center justify-center rounded-xl border border-line p-6 sm:p-10" style={{ background: previewBg(scheme) }}>
            <LogoView spec={spec} layout={layout} scheme={scheme} fonts={showFonts} className="w-full max-w-[560px]" />
          </div>
          {darkPreview && <p className="mt-1.5 text-xs text-faint">Shown on a dark panel so the white version is visible. The exported file has no background.</p>}
          {layout !== "primary" && !ARCH[spec.archetype].hasSymbol && (layout === "symbol" || layout === "stacked" || layout === "horizontal") && <p className="mt-1.5 text-xs text-faint">This concept is a wordmark, so the symbol versions use a compact monogram of its initials.</p>}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold">Export</h3>
          <p className="mb-3 mt-0.5 text-xs text-faint">Exports the lockup and colour version selected on the left.</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Format">{(["png", "jpeg", "svg", "pdf"] as Format[]).map((f) => <Chip key={f} active={format === f} onClick={() => { setFormat(f); if (f === "jpeg" && bg === "transparent") setBg("white"); }}>{f.toUpperCase()}</Chip>)}</div>
          {(format === "png" || format === "jpeg") && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-xs text-muted">Width<select value={width} onChange={(e) => setWidth(+e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-line-strong bg-elevated px-2 text-sm text-fg">{WIDTHS.map((w) => <option key={w} value={w}>{w}px</option>)}</select></label>
              <label className="text-xs text-muted">Background<select value={bg} onChange={(e) => setBg(e.target.value as typeof bg)} className="mt-1 min-h-10 w-full rounded-lg border border-line-strong bg-elevated px-2 text-sm text-fg">{!jpeg && <option value="transparent">Transparent</option>}<option value="white">White</option><option value="black">Black</option><option value="brand">Brand background</option></select></label>
              {jpeg && <label className="col-span-full text-xs text-muted">JPEG quality: {quality}<input type="range" min={60} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>}
            </div>
          )}
          <p className="mt-3 break-all font-mono text-[11px] text-faint">{fname}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" onClick={run} disabled={busy || !fonts}>{busy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Download size={15} aria-hidden />}{busy ? "Preparing…" : `Download ${format.toUpperCase()}`}</Button><Button onClick={onKit}>Brand kit…</Button></div>
          <div role="status" aria-live="polite" className="mt-3">{result && (result.kind === "error" ? <Notice tone="warn"><strong>Export failed.</strong> {result.text}</Notice> : <Notice><span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />{result.text}</span></Notice>)}</div>
        </Card>
      </div>

      <Sec title="Variants" desc="Every lockup in full colour, plus every colour version of the primary lockup.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...LAYOUTS.slice(1).map((l) => ({ l, s: "full" as Scheme })), ...SCHEMES.slice(1).map((s) => ({ l: "primary" as Layout, s }))].map(({ l, s }) => (
            <div key={l + s} className="rounded-xl border border-line p-3" style={{ background: previewBg(s) === "transparent" ? undefined : previewBg(s) }}>
              <div className="grid min-h-32 place-items-center"><LogoView spec={spec} layout={l} scheme={s} fonts={showFonts} className={`w-full ${l === "symbol" ? "max-w-[96px]" : "max-w-[220px]"}`} /></div>
              <p className={`mt-2 text-[11px] ${s === "white" ? "text-white/60" : "text-faint"}`}>{LAYOUT_LABEL[l]} · {VARIANT_LABEL[s]}</p>
            </div>))}
        </div>
      </Sec>

      <Sec title="Why this concept">
        <div className="grid gap-2 sm:grid-cols-2">
          <Pair label="Idea">{a.idea}</Pair><Pair label="Meaning">{a.meaning}</Pair><Pair label="Shape language">{a.shape}</Pair><Pair label="Typography">{a.type}</Pair>
          <Pair label="Colour">{a.color}</Pair><Pair label="Personality">{a.personality}</Pair><Pair label="Best use">{a.bestUse}</Pair><Pair label="Weaknesses">{a.weakness}</Pair>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">{a.keywords.map((k) => <Badge key={k}>{k}</Badge>)}</div>
        <div className="mt-3 flex flex-wrap gap-3">{(["ink", "accent", "bg", "deep"] as const).map((k) => <div key={k} className="flex items-center gap-2 text-xs text-muted"><span className="h-7 w-7 rounded-md border border-line" style={{ background: spec.palette[k] }} aria-hidden /><span>{k === "bg" ? "background" : k}<br /><span className="font-mono text-[11px] text-faint">{spec.palette[k].toUpperCase()}</span></span></div>)}</div>
        {motifBased && <p className="mt-2 text-xs text-faint">Symbol idea “{MOTIFS[spec.motif].label}”: {MOTIFS[spec.motif].meaning} A design reading, not a claim about your business.</p>}
      </Sec>

      <Sec title="Refine" desc="Small adjustments that keep the concept's structure.">
        <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted">Main colour<select value={spec.palette.ink} onChange={(e) => set({ palette: { ...spec.palette, ink: e.target.value } })} className="mt-1 min-h-10 w-full rounded-lg border border-line-strong bg-elevated px-2 text-sm text-fg">{colorOpts.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</select></label>
          <label className="text-xs text-muted">Accent colour<select value={spec.palette.accent} onChange={(e) => set({ palette: { ...spec.palette, accent: e.target.value } })} className="mt-1 min-h-10 w-full rounded-lg border border-line-strong bg-elevated px-2 text-sm text-fg">{accentOpts.map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}</select></label>
          <label className="text-xs text-muted">Letter spacing: {spec.tracking.toFixed(2)}em<input type="range" min={-0.05} max={0.4} step={0.01} value={spec.tracking} onChange={(e) => set({ tracking: +e.target.value })} className="mt-3 w-full accent-[var(--accent)]" /></label>
          <div className="flex flex-wrap items-end gap-2"><label className="inline-flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={spec.caps} onChange={(e) => set({ caps: e.target.checked })} />Capitals</label>
            <Button size="sm" onClick={() => set({ seed: spec.seed + 1 })}><Shuffle size={14} aria-hidden />Shuffle variation</Button></div>
          {motifBased && <label className="text-xs text-muted">Symbol shape<select value={spec.motif} onChange={(e) => set({ motif: e.target.value as ConceptSpec["motif"] })} className="mt-1 min-h-10 w-full rounded-lg border border-line-strong bg-elevated px-2 text-sm text-fg">{Object.entries(MOTIFS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</select></label>}
        </Card>
        {inkWarn && <div className="mt-2"><Notice tone="warn">The main colour has low contrast on the logo background ({contrast(spec.palette.ink, spec.palette.bg).toFixed(1)}:1). Choose a darker colour for small sizes.</Notice></div>}
      </Sec>

      <Sec title="Construction & sizes" desc="Clear space, minimum size and how it holds up when small. Rules of thumb derived from the artwork, not a legal standard.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            {fonts ? <VecView vec={outlined(clearSpace(spec, fonts), fonts)} label="Clear space diagram" className="mx-auto max-w-[360px]" /> : <div className="h-32" />}
            <p className="mt-2 text-xs text-muted">Keep <strong className="text-fg">x</strong> free on every side. x = {Math.round(base.pad)} units, a quarter of the symbol height{base.layout === "wordmark" ? " (half the lettering height for wordmarks)" : ""}.</p>
            <ul className="mt-2 space-y-1 text-[13px] text-muted"><li>Minimum on screen: <strong className="text-fg">{mins.digitalW}px</strong> wide ({mins.digitalH}px tall)</li><li>Minimum in print: about <strong className="text-fg">{mins.printMm}mm</strong> wide</li><li>Below that, use the symbol version.</li></ul>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs text-muted">Symbol at 16, 24, 32 and 48px, then the primary lockup at its minimum width:</p>
            <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-white p-4">{[16, 24, 32, 48].map((px) => <div key={px} style={{ width: px }}><LogoView spec={spec} layout="symbol" fonts={showFonts} trimTo /><span className="sr-only">{px}px</span></div>)}</div>
            <div className="mt-3 rounded-lg border border-line bg-white p-3" style={{ width: mins.digitalW + 24, maxWidth: "100%" }}><div style={{ width: mins.digitalW, maxWidth: "100%" }}><LogoView spec={spec} fonts={showFonts} trimTo /></div></div>
            <p className="mt-2 text-xs text-faint">{a.weakness}</p>
          </Card>
        </div>
      </Sec>

      <Sec title="Background compatibility" desc="The best version for each background from your direction, with its contrast ratio.">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[["White", "#ffffff"], ["Black", "#000000"], ["Background", c.background], ["Surface", c.surface], ["Primary", c.primary], ["Accent", c.accent]].map(([label, hex]) => {
            const opts: [Scheme, number][] = (["full", "black", "white"] as Scheme[]).map((s) => [s, contrast(schemeCols(spec, s).ink, hex)]);
            const [best, ratio] = opts.reduce((x, y) => (y[1] > x[1] ? y : x));
            return <div key={label} className="rounded-xl border border-line p-2" style={{ background: hex }}><LogoView spec={spec} layout="symbol" scheme={best} fonts={showFonts} className="mx-auto w-full max-w-[72px]" /><p className="mt-2 text-[11px]" style={{ color: contrast("#000000", hex) > contrast("#ffffff", hex) ? "#000" : "#fff" }}>{label}: {VARIANT_LABEL[best]} {ratio.toFixed(1)}:1 {ratio >= 3 ? "✓" : "⚠ low"}</p></div>;
          })}
        </div>
      </Sec>

      <Sec title="Applications" desc="The logo in context. Each preview is built from the same vector artwork.">
        <div className="grid gap-3 sm:grid-cols-2">
          {MOCKUPS.map((m) => <Card key={m.id} className="p-3"><div className="overflow-hidden rounded-lg">{fonts ? <VecView vec={outlined(mockup(m.id, spec, fonts), fonts)} label={m.label} /> : <div className="h-32" />}</div><div className="mt-2 flex items-center justify-between"><span className="text-sm">{m.label}</span><Button size="sm" onClick={() => saveMockup(m.id)} disabled={!fonts}>PNG</Button></div></Card>)}
        </div>
      </Sec>

      <Sec title="Do & don't">
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="space-y-1.5 text-[13px] text-muted"><li className="text-fg">Do</li><li>• Use the exported files; never redraw the logo.</li><li>• Keep the clear space and the proportions.</li><li>• Use black or white versions on photos and busy backgrounds.</li><li>• Use the symbol version for avatars and favicons.</li></ul>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["Don't stretch", { transform: "scaleX(1.6)" }, "#ffffff"], ["Don't rotate", { transform: "rotate(-14deg)" }, "#ffffff"], ["Don't add effects", { filter: "drop-shadow(3px 4px 3px rgba(0,0,0,.6))" }, "#ffffff"], ["Don't use low contrast", {}, spec.palette.ink]].map(([label, style, bgc]) => (
              <div key={label as string} className="overflow-hidden rounded-lg border border-line p-2 text-center" style={{ background: bgc as string }}><div className="mx-auto w-14 overflow-visible py-3" style={style as React.CSSProperties}><LogoView spec={spec} layout="symbol" fonts={showFonts} trimTo /></div><p className="mt-1 text-[10px] text-red-600">✕ {label as string}</p></div>))}
          </div>
        </div>
      </Sec>

      <Sec title="Use it across your project">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onSavePalette}>Save logo colours as a palette</Button><Button onClick={onSaveFonts}>Save logo font to my fonts</Button>
          <Button onClick={() => goto("components")} disabled={!selected}>Preview in UI components</Button><Button onClick={() => goto("handoff")} disabled={!selected}>See in developer handoff</Button>
        </div>
        {!selected && <p className="mt-2 text-xs text-faint">Choose “Use as my logo” to show it in component previews and the developer handoff.</p>}
      </Sec>
    </div>
  );
}
