"use client";
import { useState } from "react";
import { Braces, Check, Download, FileCode2, FileImage, FileText, Loader2, Shapes } from "lucide-react";
import { Button, Dialog, Notice, useToast } from "../ui";
import { saveBlob } from "@/lib/download";
import { stageBackground, type Custom } from "@/lib/library";
import type { Cfg, Component, Ctx } from "@/lib/library/types";
import * as X from "@/lib/library/exporters";

type Job = "svg" | "png" | "jpeg" | "pdf" | null;
interface Props { open: boolean; onClose: () => void; project: { name: string }; component: Component; cfg: Cfg; ctx: Ctx; custom: Custom; getStage: () => HTMLElement | null }

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => <section className="rounded-xl border border-line p-3"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="text-accent" aria-hidden>{icon}</span>{title}</h3>{children}</section>;

export function ExportDialog({ open, onClose, project, component: c, cfg, ctx, custom, getStage }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState<Job>(null);
  const [scale, setScale] = useState(2);
  const [bg, setBg] = useState<"stage" | "transparent" | "white" | "dark">("stage");
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<{ kind: "ok" | "warn" | "error"; text: string } | null>(null);
  const env: X.ExportEnv = { project, component: c, cfg, ctx, custom };
  const stageBg = stageBackground(ctx, custom.bg);
  const bgValue = (forJpeg: boolean): string | null => bg === "transparent" ? (forJpeg ? "#ffffff" : null) : bg === "white" ? "#ffffff" : bg === "dark" ? "#0c0c10" : stageBg ?? (forJpeg ? "#ffffff" : null);

  async function run(job: Exclude<Job, null>, fn: () => Promise<string | { text: string; warn?: boolean }>) {
    setBusy(job); setResult(null);
    try { const r = await fn(); const o = typeof r === "string" ? { text: r } : r; setResult({ kind: o.warn ? "warn" : "ok", text: o.text }); toast(o.warn ? "Exported with a note — see the dialog" : "Download started"); }
    catch (e) { const m = e instanceof Error ? e.message : "Export failed"; setResult({ kind: "error", text: m }); toast("Export failed — nothing was downloaded", "error"); }
    finally { setBusy(null); }
  }
  const stage = () => { const el = getStage(); if (!el) throw new Error("The preview isn't ready yet."); return el; };

  const doSvg = () => run("svg", async () => { const r = await X.exportSvg(env); saveBlob(r.name, r.svg, "image/svg+xml"); return { text: `Saved ${r.name} (${Math.round(r.width)}×${Math.round(r.height)}). ${r.outlined ? "Text was converted to vector outlines, so it looks identical in every design tool." : `Fonts couldn't be loaded for ${r.missing.join(", ")}, so text stays live: install those fonts to see it correctly.`}`, warn: !r.outlined }; });
  const doRaster = (format: "png" | "jpeg") => run(format, async () => { const r = await X.exportRasterFile(stage(), env, { format, scale, background: bgValue(format === "jpeg"), quality: quality / 100 }); saveBlob(r.name, r.blob); const transparent = format === "png" && !bgValue(false); return { text: `Saved ${r.name} — ${r.width}×${r.height}px${transparent ? ", transparent background" : format === "png" ? ", solid background" : ""}. ${r.fontsEmbedded ? "Fonts embedded." : `Fonts couldn't be embedded (${r.failedFonts.join(", ")}); fallback fonts were used.`}`, warn: !r.fontsEmbedded }; });
  const doPdf = () => run("pdf", async () => { const r = await X.exportPdf(stage(), env, bgValue(true) ?? "#ffffff"); saveBlob(r.name, r.bytes as BlobPart, "application/pdf"); return `Saved ${r.name} — ${r.pages} page${r.pages > 1 ? "s" : ""} with the preview, tokens and guidance as selectable text.`; });
  const file = (name: string, text: string, type: string) => { try { saveBlob(name, text, type + ";charset=utf-8"); toast(`Downloaded ${name}`); } catch { toast("Download failed", "error"); } };

  const spin = (j: Job) => busy === j ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Download size={15} aria-hidden />;
  const code: [string, string, () => string, string][] = [
    ["HTML page", "html", () => X.codeHtml(env), "text/html"], ["CSS (tokens + component)", "css", () => X.codeCss(env), "text/css"], ["React / TSX (static)", "tsx", () => X.codeTsx(env), "text/plain"],
    ["Tokens JSON (W3C format)", "tokens.json", () => X.codeTokensJson(env), "application/json"], ["Tokens CSS variables", "tokens.css", () => X.codeTokensCss(env), "text/css"],
  ];

  return (
    <Dialog open={open} onClose={onClose} title={`Export ${c.name}`} wide>
      <div className="grid gap-3">
        <Section icon={<FileImage size={16} />} title="Image (PNG / JPEG)">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-muted">Resolution<select className="mt-1 w-full rounded-lg border border-line-strong bg-elevated px-2 py-2 text-sm text-fg" value={scale} onChange={(e) => setScale(+e.target.value)}>{[1, 2, 3].map((s) => <option key={s} value={s}>{s}×</option>)}</select></label>
            <label className="text-xs text-muted">Background<select className="mt-1 w-full rounded-lg border border-line-strong bg-elevated px-2 py-2 text-sm text-fg" value={bg} onChange={(e) => setBg(e.target.value as typeof bg)}><option value="stage">Preview background</option><option value="transparent">Transparent (PNG)</option><option value="white">White</option><option value="dark">Dark</option></select></label>
            <label className="text-xs text-muted">JPEG quality: {quality}<input type="range" min={50} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" /></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><Button variant="primary" onClick={() => doRaster("png")} disabled={!!busy}>{spin("png")}PNG</Button><Button onClick={() => doRaster("jpeg")} disabled={!!busy}>{spin("jpeg")}JPEG</Button></div>
          <p className="mt-2 text-xs text-faint">Rendered from the live preview with your fonts embedded. JPEG has no transparency, so a transparent choice becomes white. File: <span className="font-mono">{X.fileName(env, "png", scale)}</span></p>
        </Section>
        <Section icon={<Shapes size={16} />} title="Vector (SVG)">
          {c.vector ? <><Button onClick={doSvg} disabled={!!busy}>{spin("svg")}SVG</Button><p className="mt-2 text-xs text-faint">Real vector shapes (not a screenshot). Text is converted to outlines when fonts load. File: <span className="font-mono">{X.fileName(env, "svg")}</span></p></> : <p className="text-[13px] leading-relaxed text-muted"><strong className="text-fg">SVG isn&rsquo;t offered for this component.</strong> {c.vectorNote ?? "It's built from interactive HTML layout (forms, overlays, responsive grids), which can't be converted to SVG without producing an inaccurate picture. Use PNG, PDF or the code export."}</p>}
        </Section>
        <Section icon={<FileText size={16} />} title="PDF specification sheet">
          <Button onClick={doPdf} disabled={!!busy}>{spin("pdf")}PDF</Button>
          <p className="mt-2 text-xs text-faint">A4 sheet: preview, variants, states, tokens, usage, accessibility and spacing — all as real, selectable text.</p>
        </Section>
        <Section icon={<FileCode2 size={16} />} title="Code & tokens">
          <ul className="grid gap-1.5 sm:grid-cols-2">{code.map(([label, ext, fn, type]) => <li key={ext} className="flex items-center justify-between gap-2 rounded-lg bg-elevated px-3 py-2 text-[13px]"><span>{label}</span><span className="flex gap-1"><Button size="sm" onClick={() => navigator.clipboard.writeText(fn()).then(() => toast(`Copied ${label}`), () => toast("Couldn't copy", "error"))}>Copy</Button><Button size="sm" onClick={() => file(`${X.fileName(env, "x").replace(/\.x$/, "")}.${ext}`, fn(), type)}>Save</Button></span></li>)}</ul>
          <p className="mt-2 text-xs text-faint"><Braces size={12} className="mr-1 inline" aria-hidden />React output is static markup (no state or handlers) and was type-checked. Interactive behavior ships in the HTML page.</p>
        </Section>
        {result && <div role="status" aria-live="polite">{result.kind === "error" ? <Notice tone="warn"><strong>Export failed.</strong> {result.text}</Notice> : <Notice tone={result.kind === "warn" ? "warn" : "info"}><span className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden /><span>{result.text}</span></span></Notice>}</div>}
      </div>
    </Dialog>
  );
}
