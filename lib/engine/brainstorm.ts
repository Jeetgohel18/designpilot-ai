import { z } from "zod";
import { IDEA_GROUPS, type Idea, type IdeaGroup, type Project } from "../types";
import { newId } from "./palette";
import { directionOf } from "./handoff";
import { starterSet } from "./starterkit";

export const ideaGroupSchema = z.enum(IDEA_GROUPS as [IdeaGroup, ...IdeaGroup[]]);
export const aiIdeasSchema = z.object({ ideas: z.array(z.object({ group: ideaGroupSchema, text: z.string().trim().min(3).max(220) })).min(1).max(12) });

const mk = (group: IdeaGroup, text: string, origin: Idea["origin"]): Idea => ({ id: newId("idea"), group, text: text.slice(0, 220), status: "open", origin, createdAt: Date.now() });

/** Ideas derived directly from the real analysis. Used for the "example board" — nothing invented about the user's business. */
export function seedFromAnalysis(p: Project): Idea[] {
  const d = directionOf(p);
  const pr = p.profile;
  const set = starterSet(p);
  const out: Idea[] = [
    ...pr.challenges.slice(0, 3).map((t) => mk("Problems", t, "analysis")),
    ...pr.businessGoals.slice(0, 2).map((t) => mk("Opportunities", t, "analysis")),
    ...(d ? d.components.slice(0, 3).map((t) => mk("Features", t, "analysis")) : []),
    ...pr.userNeeds.slice(0, 3).map((t) => mk("User needs", t, "analysis")),
    ...(d ? [d.uiInspiration[0], d.imageStyle.split(",")[0]].filter(Boolean).map((t) => mk("Visual ideas", t, "analysis")) : []),
    mk("Open questions", `What is the single most important action on the ${set.screens[0]?.name.toLowerCase() ?? "first screen"}?`, "analysis"),
    mk("Open questions", `What would make a first-time visitor trust this ${pr.industry.toLowerCase()} brand in 10 seconds?`, "analysis"),
  ];
  return out;
}

const PROMPTS: Record<IdeaGroup, (p: Project) => string[]> = {
  Problems: (p) => [`Where could ${p.profile.audience.toLowerCase()} get stuck or drop off?`, "What information do people need that we currently hide?", "Which step asks for too much effort or trust too early?", "What could go wrong on a slow mobile connection?"],
  Opportunities: (p) => [`Make the ${p.profile.industry.toLowerCase()} experience noticeably simpler than alternatives`, "Turn first-time users into advocates with a memorable moment", "Use content or community to build trust before the ask", "Offer a quick win in the first minute"],
  Features: (p) => starterSet(p).screens.slice(0, 5).map((s) => `${s.name}: ${s.purpose}`),
  "User needs": (p) => p.profile.userNeeds.map((n) => `Need: ${n}`).concat(["Clear next step at every point", "Reassurance before commitment"]),
  "Visual ideas": (p) => { const d = directionOf(p); return d ? [d.illustrationStyle, d.iconStyle, d.logoDirection, ...d.principles.map((x) => `Express the principle "${x}" visually`)] : ["Pick a direction to get visual ideas"]; },
  "Open questions": (p) => ["Who signs off on the visual direction?", "Which devices matter most on launch day?", `What does success look like in the first 3 months?`, `Which existing brand assets must be kept? (${p.profile.industry})`, "What content do we already have, and what must be created?"],
};

/** Local (non-AI) generator: draws only from the project's own analysis and curated question templates. */
export function localMore(p: Project, existing: string[], group?: IdeaGroup, count = 4): Idea[] {
  const have = new Set(existing.map((x) => x.trim().toLowerCase()));
  const groups = group ? [group] : IDEA_GROUPS;
  const out: Idea[] = [];
  for (let round = 0; out.length < count && round < 6; round++) {
    for (const g of groups) {
      const pool = PROMPTS[g](p).filter((t) => !have.has(t.trim().toLowerCase()));
      if (!pool.length) continue;
      const t = pool[0]; have.add(t.trim().toLowerCase()); out.push(mk(g, t, "local"));
      if (out.length >= count) break;
    }
  }
  return out;
}

export const fromAiIdeas = (ideas: { group: IdeaGroup; text: string }[]): Idea[] => ideas.map((i) => mk(i.group, i.text, "ai"));
export const makeIdea = (group: IdeaGroup, text: string): Idea => mk(group, text, "you");
