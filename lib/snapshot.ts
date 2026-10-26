import type { Project } from "./types";
import type { Snapshot } from "./server/shareSchema";

export function buildSnapshot(p: Project, onlyMoodboardId?: string): Snapshot {
  return {
    name: p.name, brief: p.brief, profile: p.profile, directions: p.directions, selectedDirection: p.selectedDirection,
    moodboards: p.moodboards.filter((m) => !onlyMoodboardId || m.id === onlyMoodboardId).map(({ id, name, directionId, updatedAt, items }) => ({ id, name, directionId, updatedAt, items })),
  };
}
