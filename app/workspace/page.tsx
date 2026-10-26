"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Badge, Button, inputCls, Notice } from "@/components/ui";
import { ShareSiteButton } from "@/components/SiteChrome";
import { useProject, updateProject } from "@/lib/store";
import { directionOf } from "@/lib/engine/handoff";
import { buildSnapshot } from "@/lib/snapshot";
import { OverviewTab } from "@/components/workspace/OverviewTab";
import { DirectionsTab } from "@/components/workspace/DirectionsTab";
import { TypographyTab } from "@/components/workspace/TypographyTab";
import { ColorsTab } from "@/components/workspace/ColorsTab";
import { ReferencesTab } from "@/components/workspace/ReferencesTab";
import { BrandTab } from "@/components/workspace/BrandTab";
import { AssetsTab } from "@/components/workspace/AssetsTab";
import { MoodboardTab } from "@/components/workspace/MoodboardTab";
import { HandoffTab } from "@/components/workspace/HandoffTab";
import { Assistant } from "@/components/workspace/Assistant";
import { SearchDialog } from "@/components/workspace/SearchDialog";
import { ShareDialog } from "@/components/workspace/ShareDialog";
import type { Project } from "@/lib/types";

const TABS = [
  ["overview", "Analysis"], ["directions", "Directions"], ["typography", "Typography"], ["colors", "Color"], ["references", "References"],
  ["brand", "Brand"], ["assets", "Assets"], ["moodboard", "Moodboard"], ["handoff", "Handoff"],
] as const;
type TabId = (typeof TABS)[number][0];
const STATUS: Project["status"][] = ["draft", "exploring", "ready", "handed-off"];

function Workspace() {
  const sp = useSearchParams();
  const id = sp.get("p");
  const { project, ready } = useProject(id);
  const [tab, setTab] = useState<TabId>("overview");
  const [assist, setAssist] = useState(false);
  const [search, setSearch] = useState(false);
  const [share, setShare] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // one-time read of the "analysis notice" handed over by the landing page via sessionStorage
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const n = id ? sessionStorage.getItem("dp:notice:" + id) : null; if (n) setNotice(n); } catch { /* ignore */ } }, [id]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  const goto = useCallback((t: string) => { if (TABS.some(([k]) => k === t)) { setTab(t as TabId); window.scrollTo({ top: 0 }); } }, []);
  const direction = useMemo(() => (project ? directionOf(project) : undefined), [project]);

  if (!ready) return <div className="p-10"><div className="skeleton mx-auto h-40 max-w-3xl rounded-xl" /></div>;
  if (!project) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center"><h1 className="text-xl font-semibold">Project not found</h1><p className="mt-2 text-sm text-muted">Projects are saved in the browser you created them in. This one isn&rsquo;t here — it may have been deleted, or created on another device.</p><div className="mt-6 flex justify-center gap-2"><Link href="/projects"><Button>My projects</Button></Link><Link href="/#start"><Button variant="primary">New project</Button></Link></div></div>
  );

  const props = { project, direction, goto };
  const shared = project.share?.enabled;

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-3 sm:px-4">
        <Link href="/" aria-label="Home" className="hidden sm:block"><Logo /></Link>
        <span className="hidden text-faint sm:inline">/</span>
        <input aria-label="Project name" value={project.name} onChange={(e) => updateProject(project.id, (p) => { p.name = e.target.value; })} className="min-w-0 max-w-[16rem] flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium hover:border-line focus:border-accent/50 focus:outline-none" />
        <select aria-label="Project status" value={project.status} onChange={(e) => updateProject(project.id, (p) => { p.status = e.target.value as Project["status"]; }, `Status → ${e.target.value}`)} className={`${inputCls} !hidden !w-auto !py-1 text-xs sm:!block`}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={() => setSearch(true)} aria-label="Search (Ctrl/Cmd+K)">⌕ <span className="hidden sm:inline">Search</span><kbd className="hidden rounded border border-line px-1 text-[10px] text-faint sm:inline">⌘K</kbd></Button>
          <Button size="sm" onClick={() => setShare(true)}>{shared ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}Share project</Button>
          <ShareSiteButton compact />
          <Button size="sm" variant={assist ? "primary" : "secondary"} onClick={() => setAssist(!assist)} aria-pressed={assist}>Assistant</Button>
          <Link href="/projects" className="hidden text-sm text-muted hover:text-fg md:block">My Projects</Link>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Workspace sections" className="scroll-thin hidden w-48 shrink-0 overflow-y-auto border-r border-line p-3 lg:block">
          {TABS.map(([k, l], i) => <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined} className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${tab === k ? "bg-hover text-fg" : "text-muted hover:bg-hover/60 hover:text-fg"}`}><span className="font-mono text-[10px] text-faint">{String(i + 1).padStart(2, "0")}</span>{l}</button>)}
          {direction && <div className="mt-4 rounded-lg border border-line p-3 text-xs"><p className="text-faint">Direction</p><p className="mt-0.5 font-medium">{project.selectedDirection ? direction.name : "None selected"}</p>{!project.selectedDirection && <button className="mt-1 text-accent hover:underline" onClick={() => setTab("directions")}>Choose one →</button>}</div>}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col">
          <nav aria-label="Workspace sections" className="scroll-thin flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2 lg:hidden">{TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${tab === k ? "bg-hover text-fg" : "text-muted"}`}>{l}</button>)}</nav>
          <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
              {notice && <div className="mb-5 flex items-start justify-between gap-3"><div className="flex-1"><Notice tone="warn">{notice}</Notice></div><button className="text-xs text-faint hover:text-fg" onClick={() => { setNotice(null); try { sessionStorage.removeItem("dp:notice:" + project.id); } catch { /* ignore */ } }}>Dismiss</button></div>}
              {tab !== "overview" && tab !== "directions" && !project.selectedDirection && <div className="mb-5"><Notice>No direction selected yet — showing “{direction?.name}”. <button className="text-accent underline" onClick={() => setTab("directions")}>Pick one</button> to steer everything below.</Notice></div>}
              {tab === "overview" && <OverviewTab {...props} />}
              {tab === "directions" && <DirectionsTab {...props} />}
              {tab === "typography" && <TypographyTab {...props} />}
              {tab === "colors" && <ColorsTab {...props} />}
              {tab === "references" && <ReferencesTab key={project.selectedDirection ?? "none"} {...props} />}
              {tab === "brand" && <BrandTab {...props} />}
              {tab === "assets" && <AssetsTab key={project.selectedDirection ?? "none"} {...props} />}
              {tab === "moodboard" && <MoodboardTab {...props} />}
              {tab === "handoff" && <HandoffTab {...props} />}
              <div className="mt-10 flex items-center justify-between border-t border-line pt-4 text-xs text-faint"><span>Saved in this browser · {project.activity[0]?.text}</span><Badge>{project.source === "ai" ? "AI analysis" : "Local analysis"}</Badge></div>
            </div>
          </main>
        </div>
        {assist && <div className="fixed inset-0 z-30 w-full sm:static sm:z-auto sm:w-[360px] sm:shrink-0"><Assistant project={project} goto={goto} onClose={() => setAssist(false)} /></div>}
      </div>
      <SearchDialog open={search} onClose={() => setSearch(false)} project={project} goto={goto} />
      <ShareDialog open={share} onClose={() => setShare(false)} title={`Share “${project.name}”`} kind="project" share={project.share} buildSnapshot={() => buildSnapshot(project)} onChange={(s) => updateProject(project.id, (p) => { p.share = s; }, s ? "Created project share link" : "Removed project share link")} />
    </div>
  );
}

export default function WorkspacePage() {
  return <Suspense fallback={<div className="p-10"><div className="skeleton mx-auto h-40 max-w-3xl rounded-xl" /></div>}><Workspace /></Suspense>;
}
