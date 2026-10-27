"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/SiteChrome";
import { Badge, Button, Card, Chip, ConfirmDialog, Dialog, inputCls, Notice, useToast } from "@/components/ui";
import { deleteProject, duplicateProject, updateProject, useProjects } from "@/lib/store";
import { directionOf } from "@/lib/engine/handoff";
import { ROLES, type Project } from "@/lib/types";

const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`; };

export default function ProjectsPage() {
  const { projects, ready } = useProjects();
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Project["status"]>("all");
  const [favOnly, setFavOnly] = useState(false);
  const [rename, setRename] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [del, setDel] = useState<Project | null>(null);

  const list = useMemo(() => projects.filter((p) => (status === "all" || p.status === status) && (!favOnly || p.favorite) && (!q || `${p.name} ${p.brief} ${p.profile.industry}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.updatedAt - a.updatedAt), [projects, q, status, favOnly]);
  const refs = projects.flatMap((p) => p.bookmarks.filter((b) => b.kind === "reference").map((b) => ({ ...b, project: p.name })));
  const palettes = projects.flatMap((p) => p.savedPalettes.map((s) => ({ ...s, project: p.name })));
  const pairs = projects.flatMap((p) => p.savedFonts.map((s) => ({ ...s, project: p.name })));
  const boards = projects.flatMap((p) => p.moodboards.map((m) => ({ ...m, project: p.name, pid: p.id })));
  const activity = projects.flatMap((p) => p.activity.map((a) => ({ ...a, project: p.name }))).sort((a, b) => b.at - a.at).slice(0, 8);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-2xl font-semibold tracking-tight">My Projects</h1><p className="mt-1 text-sm text-muted">{ready ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : "Loading…"}</p></div>
          <Link href="/#start"><Button variant="primary">+ New project</Button></Link>
        </div>
        <div className="mt-4"><Notice>Projects are stored <strong>in this browser only</strong> (no account yet). Clearing site data deletes them, and they won&rsquo;t appear on other devices. Use a project&rsquo;s share link to publish a read-only copy.</Notice></div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" aria-label="Search projects" className={`${inputCls} !w-60`} />
          {(["all", "draft", "exploring", "ready", "handed-off"] as const).map((s) => <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{s}</Chip>)}
          <Chip active={favOnly} onClick={() => setFavOnly(!favOnly)}>★ Favorites</Chip>
        </div>

        {ready && projects.length === 0 ? (
          <Card className="mt-8 px-6 py-16 text-center"><h2 className="text-lg font-medium">No projects yet</h2><p className="mx-auto mt-1 max-w-sm text-sm text-muted">Describe a project and DesignPilot will build your first workspace.</p><Link href="/#start"><Button variant="primary" className="mt-5">Describe a project</Button></Link></Card>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => { const d = directionOf(p); return (
              <Card key={p.id} className="flex flex-col overflow-hidden">
                <Link href={`/workspace?p=${p.id}`} className="block"><div className="flex h-16">{d && ROLES.slice(0, 6).map((r) => <div key={r} className="flex-1" style={{ background: d.palette.colors[r] }} />)}</div></Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/workspace?p=${p.id}`} className="min-w-0"><h2 className="truncate text-[15px] font-medium hover:text-accent">{p.name}</h2></Link>
                    <button onClick={() => updateProject(p.id, (x) => { x.favorite = !x.favorite; })} aria-pressed={p.favorite} aria-label={p.favorite ? "Remove favorite" : "Favorite"} className={p.favorite ? "text-amber-300" : "text-faint hover:text-fg"}>{p.favorite ? "★" : "☆"}</button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{p.profile.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="accent">{p.status}</Badge><Badge>{p.profile.industry}</Badge>{p.share?.enabled && <Badge tone="ok">shared</Badge>}{p.share && !p.share.enabled && <Badge tone="warn">link off</Badge>}</div>
                  <p className="mt-3 text-[11px] text-faint">Updated {ago(p.updatedAt)} · {p.moodboards.length} boards · {p.bookmarks.length} saved</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    <Button size="sm" variant="primary" onClick={() => router.push(`/workspace?p=${p.id}`)}>Open</Button>
                    <Button size="sm" onClick={() => { setRename(p); setName(p.name); }}>Rename</Button>
                    <Button size="sm" onClick={() => { const c = duplicateProject(p.id); if (c) toast("Project duplicated"); }}>Duplicate</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDel(p)} className="ml-auto text-red-300">Delete</Button>
                  </div>
                </div>
              </Card>
            ); })}
            {list.length === 0 && projects.length > 0 && <p className="col-span-full py-10 text-center text-sm text-muted">No projects match.</p>}
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <section className="min-w-0"><h2 className="mb-3 text-base font-semibold">Favorite references <span className="text-faint">({refs.length})</span></h2>
              {refs.length === 0 ? <p className="text-sm text-faint">Bookmark references inside a project and they appear here.</p> : <ul className="space-y-1.5">{refs.slice(0, 8).map((r) => <li key={r.id} className="flex min-w-0 justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"><a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate hover:text-accent">{r.title} ↗</a><span className="max-w-[40%] shrink-0 truncate text-xs text-faint">{r.project}</span></li>)}</ul>}</section>
            <section className="min-w-0"><h2 className="mb-3 text-base font-semibold">Recent activity</h2><ul className="space-y-1.5">{activity.map((a, i) => <li key={i} className="flex min-w-0 justify-between gap-3 text-sm"><span className="min-w-0 truncate text-muted">{a.text} <span className="text-faint">· {a.project}</span></span><span className="shrink-0 text-xs text-faint">{ago(a.at)}</span></li>)}</ul></section>
            <section className="min-w-0"><h2 className="mb-3 text-base font-semibold">Saved palettes <span className="text-faint">({palettes.length})</span></h2>
              {palettes.length === 0 ? <p className="text-sm text-faint">Use “Save palette” in the Color studio.</p> : <div className="flex flex-wrap gap-2">{palettes.slice(0, 12).map((s) => <div key={s.id} title={`${s.harmony} · ${s.project}`} className="flex h-9 w-36 overflow-hidden rounded-lg border border-line">{ROLES.slice(0, 5).map((r) => <div key={r} className="flex-1" style={{ background: s.colors[r] }} />)}</div>)}</div>}</section>
            <section className="min-w-0"><h2 className="mb-3 text-base font-semibold">Saved font pairings <span className="text-faint">({pairs.length})</span></h2>
              {pairs.length === 0 ? <p className="text-sm text-faint">Use “Save pairing” in Typography.</p> : <ul className="space-y-1 text-sm">{pairs.slice(0, 8).map((s) => <li key={s.id} className="text-muted">{s.heading} + {s.body} <span className="text-faint">· {s.project}</span></li>)}</ul>}</section>
            <section className="min-w-0 lg:col-span-2"><h2 className="mb-3 text-base font-semibold">Saved moodboards <span className="text-faint">({boards.length})</span></h2>
              {boards.length === 0 ? <p className="text-sm text-faint">Create one in the Moodboard tab.</p> : <div className="flex flex-wrap gap-2">{boards.map((b) => <Link key={b.id} href={`/workspace?p=${b.pid}`} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-line-strong"><span className="block">{b.name}</span><span className="text-xs text-faint">{b.items.length} cards · {b.project}</span></Link>)}</div>}</section>
          </div>
        )}
      </div>
      <Dialog open={!!rename} onClose={() => setRename(null)} title="Rename project">
        <form onSubmit={(e) => { e.preventDefault(); if (rename && name.trim()) { updateProject(rename.id, (x) => { x.name = name.trim(); }, "Renamed project"); setRename(null); } }}>
          <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-label="Project name" maxLength={120} />
          <div className="mt-4 flex justify-end gap-2"><Button onClick={() => setRename(null)}>Cancel</Button><Button type="submit" variant="primary">Save</Button></div>
        </form>
      </Dialog>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete this project?" body={`“${del?.name}” and its moodboards, saved palettes and bookmarks will be permanently removed from this browser.${del?.share ? " Its public share link stays live until you disable it from the project's Share dialog — do that first if you want the link to stop working." : ""}`} confirmLabel="Delete project" onConfirm={() => { if (del) { deleteProject(del.id); toast("Project deleted"); } }} />
    </Shell>
  );
}
