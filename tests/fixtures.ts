import { analyzeLocal } from "../lib/engine/analyze";
import type { Project } from "../lib/types";

export function makeProject(brief = "A premium skincare e-commerce website for Gen Z with a minimal luxury feel and organic ingredients", over: Partial<Project> = {}): Project {
  const a = analyzeLocal(brief);
  const now = Date.now();
  return { id: "p1", name: "Skincare · E-commerce", brief, settings: {}, profile: a.profile, directions: a.directions, selectedDirection: a.directions[0].id, source: "local", status: "exploring", favorite: false, bookmarks: [], savedPalettes: [], savedFonts: [], moodboards: [], activity: [], createdAt: now, updatedAt: now, ...over };
}
