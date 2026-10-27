"use client";
import { useMemo, useState } from "react";
import { Button, Card, Chip, ConfirmDialog, CopyButton, Field, inputCls, Notice, SectionHead, download, useToast } from "../ui";
import { updateProject } from "@/lib/store";
import { newId } from "@/lib/engine/palette";
import { referenceSearchLinks } from "@/lib/engine/resources";
import { useGoogleFonts } from "../FontLoader";
import { MoodCard } from "./MoodCard";
import { itemSpan, safeUrl } from "@/lib/mood";
import { ShareDialog } from "./ShareDialog";
import { buildSnapshot } from "@/lib/snapshot";
import { ROLES, type Direction, type MoodItem, type Moodboard, type Project } from "@/lib/types";
import { searchKeywords, type TabProps } from "./shared";

export function buildMoodItems(p: Project, d: Direction): MoodItem[] {
  const refs = referenceSearchLinks(searchKeywords(p, d).slice(0, 4).join(" ")).slice(0, 2);
  return [
    ...ROLES.slice(0, 5).map((r): MoodItem => ({ id: newId("mi"), type: "swatch", hex: d.palette.colors[r], label: r })),
    { id: newId("mi"), type: "type", heading: d.fonts.heading, body: d.fonts.body, sample: "Considered by design" },
    { id: newId("mi"), type: "note", text: `${d.name}: ${d.summary}\n\nPrinciples: ${d.principles.join(" · ")}` },
    { id: newId("mi"), type: "tag", group: "Photography", text: d.imageStyle },
    { id: newId("mi"), type: "tag", group: "Illustration", text: d.illustrationStyle },
    { id: newId("mi"), type: "tag", group: "Icons", text: d.iconStyle },
    { id: newId("mi"), type: "tag", group: "Logo", text: d.logoDirection },
    ...refs.map((r): MoodItem => ({ id: newId("mi"), type: "link", title: `${r.name}: ${searchKeywords(p, d).slice(0, 3).join(" ")}`, url: r.url, source: r.name })),
  ];
}

function toMarkdown(b: Moodboard) {
  return `# ${b.name}\n\n` + b.items.map((i) => i.type === "swatch" ? `- **${i.label}** ${i.hex}` : i.type === "type" ? `- **Type** ${i.heading} + ${i.body}` : i.type === "note" ? `- **Note** ${i.text.replace(/\n+/g, " ")}` : i.type === "tag" ? `- **${i.group}** ${i.text}` : i.type === "logo" ? `- **Logo concept** ${i.title}` : `- **Reference** [${i.title}](${i.url})`).join("\n");
}

export function MoodboardTab({ project: p, direction: d }: TabProps) {
  const toast = useToast();
  const [activeId, setActiveId] = useState<string | null>(p.moodboards[0]?.id ?? null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [compareId, setCompareId] = useState("");
  const [del, setDel] = useState(false);
  const [share, setShare] = useState(false);
  const [add, setAdd] = useState<"swatch" | "note" | "tag" | "link">("note");
  const [f, setF] = useState({ hex: "#8B7CFF", label: "", text: "", url: "", title: "" });
  const board = p.moodboards.find((b) => b.id === activeId) ?? p.moodboards[0];
  const cmp = p.moodboards.find((b) => b.id === compareId);
  const fontNames = useMemo(() => p.moodboards.flatMap((b) => b.items).flatMap((i) => (i.type === "type" ? [i.heading, i.body] : [])), [p.moodboards]);
  useGoogleFonts(fontNames, true);
  if (!d) return <Notice>Select a direction first.</Notice>;

  const patchBoard = (id: string, fn: (b: Moodboard) => void, msg?: string) => updateProject(p.id, (proj) => { const b = proj.moodboards.find((x) => x.id === id); if (b) { fn(b); b.updatedAt = Date.now(); } }, msg);
  const create = (dir: Direction = d) => {
    const id = newId("mb");
    updateProject(p.id, (proj) => { proj.moodboards.unshift({ id, name: `${dir.name} board`, directionId: dir.id, items: buildMoodItems(proj, dir), updatedAt: Date.now() }); }, `Created moodboard from ${dir.name}`);
    setActiveId(id); toast("Moodboard created from the direction");
  };
  const move = (from: number, to: number) => { if (!board || from === to || to < 0 || to >= board.items.length) return; patchBoard(board.id, (b) => { const [it] = b.items.splice(from, 1); b.items.splice(to, 0, it); }); };

  function addItem(e: React.FormEvent) {
    e.preventDefault(); if (!board) return;
    let item: MoodItem | null = null;
    if (add === "swatch") { if (!/^#[0-9a-f]{6}$/i.test(f.hex)) return toast("Enter a valid hex color", "error"); item = { id: newId("mi"), type: "swatch", hex: f.hex.toUpperCase(), label: f.label || "custom" }; }
    if (add === "note") { if (!f.text.trim()) return toast("Write a note first", "error"); item = { id: newId("mi"), type: "note", text: f.text.trim() }; }
    if (add === "tag") { if (!f.text.trim()) return toast("Write something first", "error"); item = { id: newId("mi"), type: "tag", group: f.label || "Idea", text: f.text.trim() }; }
    if (add === "link") { const u = safeUrl(f.url); if (!u) return toast("Enter a full link starting with https://", "error"); item = { id: newId("mi"), type: "link", title: f.title || new URL(u).hostname, url: u, source: new URL(u).hostname }; }
    if (item) { const it = item; patchBoard(board.id, (b) => { b.items.push(it); }, "Added moodboard item"); setF({ ...f, text: "", title: "", url: "", label: "" }); }
  }

  return (
    <div className="rise">
      <SectionHead title="Moodboards" desc="Collect swatches, type, notes and references. Drag cards (or use the arrows) to rearrange. Boards are saved automatically." right={<><Button size="sm" variant="primary" onClick={() => create()}>+ New from direction</Button></>} />
      {p.moodboards.length === 0 ? (
        <Card className="px-6 py-12 text-center"><p className="text-sm text-muted">No moodboards yet. Build one from “{d.name}” — swatches, type, notes and reference links in one click.</p><Button className="mt-4" variant="primary" onClick={() => create()}>Create moodboard</Button></Card>
      ) : board && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {p.moodboards.map((b) => <Chip key={b.id} active={b.id === board.id} onClick={() => setActiveId(b.id)}>{b.name}</Chip>)}
          </div>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="Board name"><input className={`${inputCls} !w-56`} value={board.name} onChange={(e) => patchBoard(board.id, (b) => { b.name = e.target.value; })} /></Field>
            <Field label="Visual direction"><select className={`${inputCls} !w-48`} value={board.directionId} onChange={(e) => patchBoard(board.id, (b) => { b.directionId = e.target.value; })}>{p.directions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
            <Button size="sm" onClick={() => { const dir = p.directions.find((x) => x.id === board.directionId) ?? d; patchBoard(board.id, (b) => { b.items = buildMoodItems(p, dir); b.name = `${dir.name} board`; }, `Rebuilt moodboard from ${dir.name}`); toast(`Board rebuilt from ${dir.name}`); }}>Rebuild from direction</Button>
            <Field label="Compare with"><select className={`${inputCls} !w-44`} value={compareId} onChange={(e) => setCompareId(e.target.value)}><option value="">— none —</option>{p.moodboards.filter((b) => b.id !== board.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
            <div className="ml-auto flex flex-wrap gap-2">
              <CopyButton text={toMarkdown(board)} label="Copy as Markdown" what="Moodboard" size="md" />
              <Button onClick={() => download(`${board.name.replace(/\W+/g, "-").toLowerCase()}.json`, JSON.stringify(board, null, 2), "application/json")}>Export JSON</Button>
              <Button onClick={() => setShare(true)}>{board.share?.enabled ? "Shared ●" : "Share"}</Button>
              <Button variant="danger" onClick={() => setDel(true)}>Delete</Button>
            </div>
          </div>

          <div className={cmp ? "grid gap-6 lg:grid-cols-2" : ""}>
            <div>
              {cmp && <p className="mb-2 text-xs text-faint">Editing: {board.name}</p>}
              <ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Moodboard cards">
                {board.items.map((it, i) => (
                  <li key={it.id} draggable onDragStart={() => setDragFrom(i)} onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragEnd={() => { setDragFrom(null); setOver(null); }} onDrop={() => { if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); setOver(null); }}
                    className={`group btn-drag relative ${itemSpan(it)} ${over === i && dragFrom !== i ? "outline outline-2 outline-accent" : ""} ${dragFrom === i ? "opacity-40" : ""} rounded-xl`}>
                    <MoodCard item={it} />
                    <div className="absolute right-1.5 top-1.5 hidden gap-0.5 rounded-lg bg-black/70 p-0.5 text-white backdrop-blur group-hover:flex group-focus-within:flex">
                      <button className="rounded px-1.5 py-0.5 text-xs hover:bg-white/20" onClick={() => move(i, i - 1)} aria-label="Move earlier">←</button>
                      <button className="rounded px-1.5 py-0.5 text-xs hover:bg-white/20" onClick={() => move(i, i + 1)} aria-label="Move later">→</button>
                      <button className="rounded px-1.5 py-0.5 text-xs hover:bg-red-500/60" onClick={() => patchBoard(board.id, (b) => { b.items = b.items.filter((x) => x.id !== it.id); }, "Removed moodboard item")} aria-label="Remove card">✕</button>
                    </div>
                  </li>
                ))}
              </ul>
              {board.items.length === 0 && <p className="py-8 text-center text-sm text-muted">Empty board — add something below.</p>}
            </div>
            {cmp && (
              <div><p className="mb-2 text-xs text-faint">Comparing: {cmp.name} (read-only)</p>
                <ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4">{cmp.items.map((it) => <li key={it.id} className={itemSpan(it)}><MoodCard item={it} /></li>)}</ul></div>
            )}
          </div>

          <Card className="mt-6 p-4">
            <h3 className="mb-3 text-sm font-medium">Add to board</h3>
            <div className="mb-3 flex gap-2">{(["note", "swatch", "tag", "link"] as const).map((t) => <Chip key={t} active={add === t} onClick={() => setAdd(t)}>{{ note: "Note", swatch: "Color", tag: "Idea tag", link: "Link" }[t]}</Chip>)}</div>
            <form onSubmit={addItem} className="flex flex-wrap items-end gap-3">
              {add === "swatch" && <><Field label="Hex"><input className={`${inputCls} !w-32 font-mono`} value={f.hex} onChange={(e) => setF({ ...f, hex: e.target.value })} /></Field><Field label="Label"><input className={`${inputCls} !w-40`} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field></>}
              {add === "note" && <Field label="Note"><textarea rows={2} className={`${inputCls} w-full sm:!w-96`} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>}
              {add === "tag" && <><Field label="Group"><input className={`${inputCls} !w-36`} value={f.label} placeholder="e.g. Motion" onChange={(e) => setF({ ...f, label: e.target.value })} /></Field><Field label="Idea"><input className={`${inputCls} w-full sm:!w-80`} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field></>}
              {add === "link" && <><Field label="Title"><input className={`${inputCls} !w-48`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field><Field label="URL"><input className={`${inputCls} w-full sm:!w-80`} placeholder="https://…" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field></>}
              <Button type="submit" variant="primary">Add</Button>
            </form>
          </Card>
          <ConfirmDialog open={del} onClose={() => setDel(false)} title="Delete this moodboard?" body={`“${board.name}” will be removed from this project.${board.share ? " Its share link will stay active until you delete it from the share dialog — open Share first if you want to turn it off." : ""}`} confirmLabel="Delete moodboard" onConfirm={() => { updateProject(p.id, (proj) => { proj.moodboards = proj.moodboards.filter((b) => b.id !== board.id); }, "Deleted moodboard"); setActiveId(null); }} />
          <ShareDialog open={share} onClose={() => setShare(false)} title={`Share “${board.name}”`} kind="moodboard" share={board.share} buildSnapshot={() => buildSnapshot(p, board.id)} onChange={(s) => patchBoard(board.id, (b) => { b.share = s; }, s ? "Created moodboard share link" : "Removed moodboard share link")} />
        </>
      )}
    </div>
  );
}
