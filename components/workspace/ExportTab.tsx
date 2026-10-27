"use client";
import { useState } from "react";
import { Archive, Download, ExternalLink, Eye, FileCode2, FileJson, FileText, Palette, Printer } from "lucide-react";
import { Button, Card, Dialog, EmptyState, Notice, SectionHead, useToast } from "../ui";
import { EXPORTS, moodboardHtml, slug, type ExportItem } from "@/lib/engine/exports";
import { makeZip } from "@/lib/zip";
import type { TabProps } from "./shared";
import type { Moodboard } from "@/lib/types";

const ICON: Record<string, React.ReactNode> = { Documentation: <FileText size={16} aria-hidden />, "Design tokens": <Palette size={16} aria-hidden />, "Developer handoff": <FileCode2 size={16} aria-hidden />, Moodboard: <FileJson size={16} aria-hidden /> };

function saveBlob(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000); // release the temporary object URL
}
function openBlob(data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const w = window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return !!w;
}

export function ExportTab({ project: p }: TabProps) {
  const toast = useToast();
  const [preview, setPreview] = useState<{ title: string; text: string } | null>(null);
  const prefix = slug(p.name);

  function run<T>(label: string, fn: () => T): T | undefined {
    try { return fn(); } catch (e) { console.error(`[export] ${label} failed`, e instanceof Error ? e.message : e); toast(`Couldn't create ${label}. Nothing was downloaded.`, "error"); }
  }
  const dl = (e: ExportItem) => run(e.title, () => { const text = e.build(p); saveBlob(`${prefix}-${e.filename}`, text, `${e.mime};charset=utf-8`); toast(`Downloaded ${prefix}-${e.filename}`); });
  const open = (e: ExportItem) => run(e.title, () => { if (!openBlob(e.build(p), "text/html;charset=utf-8")) toast("Your browser blocked the new tab. Allow pop-ups, or use Download.", "error"); else toast("Opened. Use Print → Save as PDF."); });
  const view = (e: ExportItem) => run(e.title, () => setPreview({ title: e.title, text: e.build(p) }));
  const all = () => run("the ZIP", () => {
    const files = EXPORTS.map((e) => ({ name: e.filename, content: e.build(p) }));
    p.moodboards.forEach((b, i) => { files.push({ name: `moodboard-${i + 1}-${slug(b.name)}.html`, content: moodboardHtml(p, b) }); });
    saveBlob(`${prefix}-design-package.zip`, makeZip(files) as BlobPart, "application/zip"); toast(`Downloaded ${files.length} files in ${prefix}-design-package.zip`);
  });
  const board = (b: Moodboard, mode: "html" | "json" | "open") => run("the moodboard", () => {
    if (mode === "json") { saveBlob(`${prefix}-${slug(b.name)}.json`, JSON.stringify(b, null, 2), "application/json"); toast("Moodboard JSON downloaded"); }
    else if (mode === "html") { saveBlob(`${prefix}-${slug(b.name)}.html`, moodboardHtml(p, b), "text/html;charset=utf-8"); toast("Print-friendly moodboard downloaded"); }
    else if (!openBlob(moodboardHtml(p, b), "text/html;charset=utf-8")) toast("Your browser blocked the new tab. Allow pop-ups, or use Download.", "error");
  });

  const groups = [...new Set(EXPORTS.map((e) => e.group))] as ExportItem["group"][];
  return (
    <div className="rise">
      <SectionHead title="Export & download" desc="Real files built from your current project. Nothing is placeholder content." right={<Button variant="primary" onClick={all}><Archive size={15} aria-hidden />Download everything (.zip)</Button>} />
      <Notice>Files are generated in your browser from this project&rsquo;s current data. The “PDF” is your browser&rsquo;s <em>Print → Save as PDF</em> on a print-ready page. DesignPilot does not generate Figma, Canva or other editable design files, or moodboard images.</Notice>

      {groups.map((g) => (
        <section key={g} className="mt-8" aria-labelledby={`ex-${g}`}>
          <h3 id={`ex-${g}`} className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">{ICON[g]}</span>{g}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXPORTS.filter((e) => e.group === g).map((e) => (
              <Card key={e.id} className="flex flex-col p-4">
                <h4 className="text-sm font-medium">{e.title}</h4><p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted">{e.desc}</p>
                <p className="mt-2 font-mono text-[11px] text-faint">{prefix}-{e.filename}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={() => dl(e)}><Download size={14} aria-hidden />Download</Button>
                  {e.open && <Button size="sm" onClick={() => open(e)}><Printer size={14} aria-hidden />Open to print</Button>}
                  <Button size="sm" variant="ghost" onClick={() => view(e)}><Eye size={14} aria-hidden />Preview</Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-8" aria-labelledby="ex-mb">
        <h3 id="ex-mb" className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="text-accent">{ICON.Moodboard}</span>Moodboards</h3>
        {p.moodboards.length === 0 ? <EmptyState title="No moodboards yet" icon={<FileJson size={20} aria-hidden />}>Create a moodboard in the Moodboard tab to export it as a print-friendly page.</EmptyState> : (
          <div className="grid gap-3 sm:grid-cols-2">{p.moodboards.map((b) => (
            <Card key={b.id} className="p-4"><h4 className="text-sm font-medium">{b.name}</h4><p className="mt-1 text-[13px] text-muted">{b.items.length} cards · print-friendly HTML or JSON</p>
              <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="primary" onClick={() => board(b, "html")}><Download size={14} aria-hidden />HTML</Button><Button size="sm" onClick={() => board(b, "open")}><ExternalLink size={14} aria-hidden />Open to print</Button><Button size="sm" onClick={() => board(b, "json")}>JSON</Button></div></Card>
          ))}</div>
        )}
        <p className="mt-2 text-xs text-faint">Moodboard image (PNG) export isn&rsquo;t available yet — it needs rendering support that isn&rsquo;t in this app.</p>
      </section>

      <Dialog open={!!preview} onClose={() => setPreview(null)} title={preview?.title ?? "Preview"} wide>
        <pre className="scroll-thin max-h-[60dvh] overflow-auto rounded-lg bg-elevated p-3 font-mono text-[11.5px] leading-relaxed text-muted whitespace-pre-wrap">{preview?.text}</pre>
      </Dialog>
    </div>
  );
}
