"use client";
import type { Direction, Project } from "@/lib/types";
import { directionOf } from "@/lib/engine/handoff";
import { updateProject } from "@/lib/store";
import { newId } from "@/lib/engine/palette";

export interface TabProps { project: Project; direction: Direction | undefined; goto: (tab: string) => void }

export const dirOf = directionOf;

export { searchKeywords } from "@/lib/searchKeywords";

export function toggleBookmark(p: Project, b: { kind: "reference" | "font" | "palette" | "icon" | "asset"; title: string; url?: string; source?: string; note?: string }) {
  const key = b.url ?? b.title;
  const has = p.bookmarks.some((x) => (x.url ?? x.title) === key && x.kind === b.kind);
  updateProject(p.id, (d) => {
    d.bookmarks = has ? d.bookmarks.filter((x) => !((x.url ?? x.title) === key && x.kind === b.kind)) : [{ id: newId("bm"), at: Date.now(), ...b }, ...d.bookmarks];
  }, has ? `Removed bookmark: ${b.title}` : `Bookmarked: ${b.title}`);
}
export const isBookmarked = (p: Project, kind: string, key: string) => p.bookmarks.some((x) => x.kind === kind && (x.url ?? x.title) === key);

export function BookmarkButton({ p, b }: { p: Project; b: Parameters<typeof toggleBookmark>[1] }) {
  const on = isBookmarked(p, b.kind, b.url ?? b.title);
  return (
    <button onClick={() => toggleBookmark(p, b)} aria-pressed={on} aria-label={on ? `Remove bookmark ${b.title}` : `Bookmark ${b.title}`} title={on ? "Bookmarked" : "Bookmark"}
      className={`rounded-md p-1.5 transition-colors hover:bg-hover ${on ? "text-accent" : "text-faint hover:text-fg"}`}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>
    </button>
  );
}

export function Swatches({ d, h = 36 }: { d: Direction; h?: number }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line" style={{ height: h }} aria-label={`${d.name} palette`}>
      {(["primary", "secondary", "accent", "background", "surface", "text"] as const).map((r) => <div key={r} className="flex-1" style={{ background: d.palette.colors[r] }} title={`${r} ${d.palette.colors[r]}`} />)}
    </div>
  );
}
