"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Blocks, Check, Code2, Compass, Download, FileText, Fingerprint, Image as ImageIcon, Images, Lightbulb, ListChecks, Menu, MessageSquare, Palette, Search, Share2, Type, X, Telescope, Layers } from "lucide-react";
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
import { SimilarTab } from "@/components/workspace/SimilarTab";
import { ComponentsTab } from "@/components/workspace/ComponentsTab";
import { StartTab } from "@/components/workspace/StartTab";
import { BrainstormTab } from "@/components/workspace/BrainstormTab";
import { ReferencesTab } from "@/components/workspace/ReferencesTab";
import { BrandTab } from "@/components/workspace/BrandTab";
import { AssetsTab } from "@/components/workspace/AssetsTab";
import { MoodboardTab } from "@/components/workspace/MoodboardTab";
import { HandoffTab } from "@/components/workspace/HandoffTab";
import { ExportTab } from "@/components/workspace/ExportTab";
import { Assistant } from "@/components/workspace/Assistant";
import { SearchDialog } from "@/components/workspace/SearchDialog";
import { ShareDialog } from "@/components/workspace/ShareDialog";
import type { Project } from "@/lib/types";

type TabId = "overview" | "directions" | "moodboard" | "typography" | "colors" | "components" | "start" | "brainstorm" | "references" | "similar" | "brand" | "assets" | "handoff" | "export";
const NAV: { group: string; items: { id: TabId; label: string; icon: React.ReactNode; hint: string }[] }[] = [
  { group: "Understand", items: [{ id: "overview", label: "Overview", icon: <FileText size={16} />, hint: "What the analysis found" }, { id: "directions", label: "Creative directions", icon: <Compass size={16} />, hint: "Compare and choose" }] },
  { group: "Explore", items: [{ id: "moodboard", label: "Moodboard", icon: <Images size={16} />, hint: "Collect the look and feel" }, { id: "typography", label: "Typography", icon: <Type size={16} />, hint: "Fonts and pairings" }, { id: "colors", label: "Colors", icon: <Palette size={16} />, hint: "Palettes and contrast" }, { id: "components", label: "UI components", icon: <Blocks size={16} />, hint: "Live styled components" }] },
  { group: "Build", items: [{ id: "start", label: "Start designing", icon: <ListChecks size={16} />, hint: "Screens, journeys, checklist" }, { id: "brainstorm", label: "Brainstorming", icon: <Lightbulb size={16} />, hint: "Shape ideas into tasks" }] },
  { group: "Resources", items: [{ id: "references", label: "Inspiration & research", icon: <Telescope size={16} />, hint: "Competitors and references" }, { id: "similar", label: "Similar references", icon: <Layers size={16} />, hint: "Real, project-specific references" }, { id: "brand", label: "Logo & brand", icon: <Fingerprint size={16} />, hint: "Brand research, logo concepts" }, { id: "assets", label: "Images & assets", icon: <ImageIcon size={16} />, hint: "Photos, icons, illustrations" }] },
  { group: "Deliver", items: [{ id: "handoff", label: "Developer handoff", icon: <Code2 size={16} />, hint: "CSS, tokens, brief" }, { id: "export", label: "Export & download", icon: <Download size={16} />, hint: "Files you can keep" }] },
];
const IDS = NAV.flatMap((g) => g.items.map((i) => i.id));
const STATUS: Project["status"][] = ["draft", "exploring", "ready", "handed-off"];

function ago(t: number, now: number) { const s = Math.max(0, Math.round((now - t) / 1000)); return s < 10 ? "just now" : s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`; }

function SideNav({ tab, setTab, hasDirection, onPick }: { tab: TabId; setTab: (t: TabId) => void; hasDirection: boolean; onPick?: () => void }) {
  return (
    <nav aria-label="Workspace sections" className="grid gap-4">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-faint">{g.group}</p>
          {g.items.map((i) => (
            <button key={i.id} onClick={() => { setTab(i.id); onPick?.(); }} aria-current={tab === i.id ? "page" : undefined} title={i.hint}
              className={`relative flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${tab === i.id ? "bg-hover text-fg" : "text-muted hover:bg-hover/60 hover:text-fg"}`}>
              {tab === i.id && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded bg-accent" aria-hidden />}
              <span className={tab === i.id ? "text-accent" : "text-faint"} aria-hidden>{i.icon}</span>{i.label}
              {i.id === "directions" && !hasDirection && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" title="Choose a direction" aria-label="Action needed" />}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Workspace() {
  const sp = useSearchParams();
  const id = sp.get("p");
  const { project, ready } = useProject(id);
  const [tab, setTabState] = useState<TabId>(() => { const t = sp.get("tab") as TabId | null; return t && IDS.includes(t) ? t : "overview"; });
  const [assist, setAssist] = useState(false);
  const [search, setSearch] = useState(false);
  const [share, setShare] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // one-time read of the "analysis notice" handed over by the landing page via sessionStorage
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const n = id ? sessionStorage.getItem("dp:notice:" + id) : null; if (n) setNotice(n); } catch { /* ignore */ } }, [id]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => { document.body.style.overflow = menu ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menu]);

  const setTab = useCallback((t: TabId) => {
    setTabState(t); window.scrollTo({ top: 0 });
    try { const u = new URL(window.location.href); u.searchParams.set("tab", t); window.history.replaceState(null, "", u); } catch { /* ignore */ }
  }, []);
  const goto = useCallback((t: string) => { if ((IDS as string[]).includes(t)) setTab(t as TabId); }, [setTab]);
  const direction = useMemo(() => (project ? directionOf(project) : undefined), [project]);

  if (!ready) return <div className="p-6 sm:p-10"><div className="skeleton mx-auto h-40 max-w-3xl rounded-xl" /></div>;
  if (!project) return (
    <div className="mx-auto max-w-md px-6 py-24 text-center"><h1 className="text-xl font-semibold">Project not found</h1><p className="mt-2 text-sm text-muted">Projects are saved in the browser you created them in. This one isn&rsquo;t here — it may have been deleted, or created on another device.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Link href="/projects"><Button>My projects</Button></Link><Link href="/#start"><Button variant="primary">New project</Button></Link></div></div>
  );

  const props = { project, direction, goto };
  const shared = project.share?.enabled;
  const current = NAV.flatMap((g) => g.items).find((i) => i.id === tab)!;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-[#0b0a14]">Skip to content</a>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 sm:gap-3 sm:px-4">
        <button className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-fg lg:hidden" aria-label="Open sections menu" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={20} /></button>
        <Link href="/" aria-label="Home" className="hidden lg:block"><Logo /></Link>
        <span className="hidden text-faint lg:inline">/</span>
        <div className="min-w-0 flex-1">
          <input aria-label="Project name" value={project.name} maxLength={120} onChange={(e) => updateProject(project.id, (p) => { p.name = e.target.value; })} className="w-full max-w-[18rem] rounded-md border border-transparent bg-transparent px-2 py-0.5 text-sm font-medium hover:border-line focus:border-accent/50 focus:outline-none" />
          <p className="flex items-center gap-1 px-2 text-[11px] text-faint" aria-live="polite"><Check size={11} className="text-emerald-400" aria-hidden /><span className="truncate">Saved<span className="hidden sm:inline"> in this browser</span> · {ago(project.updatedAt, now)}</span></p>
        </div>
        <select aria-label="Project status" value={project.status} onChange={(e) => updateProject(project.id, (p) => { p.status = e.target.value as Project["status"]; }, `Status → ${e.target.value}`)} className={`${inputCls} !hidden !w-auto !py-1 text-xs md:!block`}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button size="sm" onClick={() => setSearch(true)} aria-label="Search (Ctrl/Cmd+K)"><Search size={14} aria-hidden /><span className="hidden sm:inline">Search</span></Button>
          <Button size="sm" onClick={() => setShare(true)} aria-label="Share project">{shared ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden /> : null}<Share2 size={14} aria-hidden /><span className="hidden sm:inline">Share</span></Button>
          <span className="hidden sm:block"><ShareSiteButton compact /></span>
          <Button size="sm" variant={assist ? "primary" : "secondary"} onClick={() => setAssist(!assist)} aria-pressed={assist} aria-label="Design assistant"><MessageSquare size={14} aria-hidden /><span className="hidden sm:inline">Assistant</span></Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="scroll-thin hidden w-56 shrink-0 overflow-y-auto border-r border-line p-3 lg:block">
          <SideNav tab={tab} setTab={setTab} hasDirection={!!project.selectedDirection} />
          {direction && <div className="mt-5 rounded-lg border border-line p-3 text-xs"><p className="text-faint">Direction</p><p className="mt-0.5 font-medium">{project.selectedDirection ? direction.name : "None selected"}</p>{!project.selectedDirection && <button className="mt-1 text-accent hover:underline" onClick={() => setTab("directions")}>Choose one →</button>}</div>}
          <Link href="/projects" className="mt-4 block px-3 text-xs text-muted hover:text-fg">← My projects</Link>
        </aside>

        <main id="main" tabIndex={-1} className="scroll-thin min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-faint"><span>{NAV.find((g) => g.items.some((i) => i.id === tab))?.group}</span><span aria-hidden>/</span><span className="font-medium text-muted">{current.label}</span><span className="hidden sm:inline">— {current.hint}</span></div>
            {notice && (tab === "overview" || tab === "directions") && <div className="mb-5 flex items-start justify-between gap-3"><div className="flex-1"><Notice tone="warn">{notice}</Notice></div><button className="min-h-9 text-xs text-faint hover:text-fg" onClick={() => { setNotice(null); try { sessionStorage.removeItem("dp:notice:" + project.id); } catch { /* ignore */ } }}>Dismiss</button></div>}
            {!["overview", "directions", "references", "similar", "assets", "export", "brainstorm"].includes(tab) && !project.selectedDirection && <div className="mb-5"><Notice>No direction selected yet — showing “{direction?.name}”. <button className="text-accent underline" onClick={() => setTab("directions")}>Choose one</button> to steer everything below.</Notice></div>}
            {tab === "overview" && <OverviewTab {...props} />}
            {tab === "directions" && <DirectionsTab {...props} />}
            {tab === "moodboard" && <MoodboardTab {...props} />}
            {tab === "typography" && <TypographyTab {...props} />}
            {tab === "colors" && <ColorsTab {...props} />}
            {tab === "similar" && <SimilarTab {...props} />}
            {tab === "components" && <ComponentsTab key={project.selectedDirection ?? "none"} {...props} />}
            {tab === "start" && <StartTab {...props} />}
            {tab === "brainstorm" && <BrainstormTab {...props} />}
            {tab === "references" && <ReferencesTab key={project.selectedDirection ?? "none"} {...props} />}
            {tab === "brand" && <BrandTab {...props} />}
            {tab === "assets" && <AssetsTab key={project.selectedDirection ?? "none"} {...props} />}
            {tab === "handoff" && <HandoffTab {...props} />}
            {tab === "export" && <ExportTab {...props} />}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-faint"><span>{project.activity[0]?.text}</span><Badge>{project.source === "ai" ? "AI analysis" : "Local fallback analysis"}</Badge></div>
          </div>
        </main>
        {assist && <div className="fixed inset-0 z-40 sm:static sm:z-auto sm:w-[360px] sm:shrink-0"><Assistant project={project} goto={goto} onClose={() => setAssist(false)} /></div>}
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace sections">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col border-r border-line-strong bg-surface shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3"><Logo /><button className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-hover" aria-label="Close menu" onClick={() => setMenu(false)}><X size={20} /></button></div>
            <div className="scroll-thin flex-1 overflow-y-auto p-3"><SideNav tab={tab} setTab={setTab} hasDirection={!!project.selectedDirection} onPick={() => setMenu(false)} />
              <div className="mt-5 grid gap-1 border-t border-line pt-3 text-sm"><Link href="/projects" className="rounded-lg px-3 py-2.5 text-muted hover:bg-hover">← My projects</Link><div className="px-3 py-1"><label className="text-xs text-faint" htmlFor="m-status">Status</label><select id="m-status" value={project.status} onChange={(e) => updateProject(project.id, (p) => { p.status = e.target.value as Project["status"]; })} className={`${inputCls} mt-1`}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></div></div></div>
          </div>
        </div>
      )}
      <SearchDialog open={search} onClose={() => setSearch(false)} project={project} goto={goto} />
      <ShareDialog open={share} onClose={() => setShare(false)} title={`Share “${project.name}”`} kind="project" share={project.share} buildSnapshot={() => buildSnapshot(project)} onChange={(s) => updateProject(project.id, (p) => { p.share = s; }, s ? "Created project share link" : "Removed project share link")} />
    </div>
  );
}

export default function WorkspacePage() {
  return <Suspense fallback={<div className="p-6 sm:p-10"><div className="skeleton mx-auto h-40 max-w-3xl rounded-xl" /></div>}><Workspace /></Suspense>;
}
