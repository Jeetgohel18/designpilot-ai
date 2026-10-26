"use client";
import { useSyncExternalStore } from "react";
import type { Direction, Project, ProjectProfile, ProjectSettings, Source } from "./types";
import { newId } from "./engine/palette";

// Persistence: browser localStorage (per device/browser). No account system yet — see README.
const KEY = "designpilot:projects:v1";
const listeners = new Set<() => void>();
let cacheRaw: string | null | undefined;
let cacheVal: Project[] = [];
const EMPTY: Project[] = [];

function read(): Project[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try { cacheVal = raw ? (JSON.parse(raw) as Project[]) : []; } catch { cacheVal = []; }
  return cacheVal;
}

let memoryOnly: Project[] | null = null; // fallback when storage is unavailable
function write(next: Project[]) {
  try {
    const raw = JSON.stringify(next);
    localStorage.setItem(KEY, raw);
    cacheRaw = raw; cacheVal = next; memoryOnly = null;
  } catch { memoryOnly = next; cacheRaw = undefined; cacheVal = next; }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cacheRaw = undefined; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
};

export function useProjects(): { projects: Project[]; ready: boolean } {
  const projects = useSyncExternalStore(subscribe, () => memoryOnly ?? read(), () => EMPTY);
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  return { projects, ready };
}
export function useProject(id: string | null) {
  const { projects, ready } = useProjects();
  return { project: id ? projects.find((p) => p.id === id) : undefined, ready };
}

export const getProjects = () => memoryOnly ?? read();
export const nameFromBrief = (b: string) => {
  const w = b.replace(/\s+/g, " ").trim().split(" ").slice(0, 6).join(" ");
  return w.length > 40 ? w.slice(0, 40) + "…" : w;
};

export function createProject(input: { brief: string; settings: ProjectSettings; profile: ProjectProfile; directions: Direction[]; source: Source }): Project {
  const now = Date.now();
  const p: Project = {
    id: newId("prj"), name: `${input.profile.industry.split(" & ")[0]} · ${input.profile.projectType}`, brief: input.brief, settings: input.settings, profile: input.profile, directions: input.directions,
    selectedDirection: null, source: input.source, status: "exploring", favorite: false, bookmarks: [], savedPalettes: [], savedFonts: [], moodboards: [],
    activity: [{ at: now, text: `Project created (${input.source === "ai" ? "AI analysis" : "local analysis"})` }], createdAt: now, updatedAt: now,
  };
  write([p, ...getProjects()]);
  return p;
}

export function updateProject(id: string, fn: (p: Project) => Project | void, activity?: string) {
  write(getProjects().map((p) => {
    if (p.id !== id) return p;
    const draft = structuredClone(p);
    const out = fn(draft) ?? draft;
    out.updatedAt = Date.now();
    if (activity) out.activity = [{ at: out.updatedAt, text: activity }, ...out.activity].slice(0, 40);
    return out;
  }));
}

export function deleteProject(id: string) { write(getProjects().filter((p) => p.id !== id)); }
export function duplicateProject(id: string): Project | undefined {
  const src = getProjects().find((p) => p.id === id);
  if (!src) return;
  const now = Date.now();
  const copy: Project = { ...structuredClone(src), id: newId("prj"), name: `${src.name} (copy)`, share: undefined, createdAt: now, updatedAt: now, activity: [{ at: now, text: `Duplicated from "${src.name}"` }] };
  write([copy, ...getProjects()]);
  return copy;
}
export function importProject(p: Project) { write([p, ...getProjects().filter((x) => x.id !== p.id)]); }
