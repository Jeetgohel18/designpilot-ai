import type { Direction, Project } from "./types";

/** Keywords used to build searches: project keywords + selected-direction mood (this is how a chosen direction refines results). */
export function searchKeywords(p: Project, d?: Direction): string[] {
  const base = p.profile.keywords.slice(0, 5);
  const mood = d ? [d.name.toLowerCase(), ...p.profile.visualMood.slice(0, 2)] : p.profile.visualMood.slice(0, 2);
  return [...new Set([...base, ...mood])];
}
