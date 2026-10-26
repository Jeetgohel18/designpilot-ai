import { FONTS, explainPairing } from "../fonts";
import { contrast } from "../color";
import { directionOf, designBrief } from "./handoff";
import type { Project } from "../types";

export type AssistantAction =
  | { type: "alt-palettes" }
  | { type: "regenerate-direction"; directionId: string }
  | { type: "more-premium" }
  | { type: "goto"; tab: string }
  | { type: "none" };

export interface AssistantReply { reply: string; action: AssistantAction }

/** Rule-based intent handler. Used as the offline assistant and to attach real UI actions to AI replies. */
export function localAssistant(message: string, project: Project): AssistantReply {
  const m = message.toLowerCase();
  const d = directionOf(project);
  if (!d) return { reply: "Generate an analysis first, then I can help refine it.", action: { type: "none" } };

  if (/alternative|another|more palettes|different (colou?r|palette)|three .*palette/.test(m))
    return { reply: "I've added three new palette alternatives to the Color studio, based on your selected direction's hue family. Locked colors are kept.", action: { type: "alt-palettes" } };
  if (/premium|luxur|high-?end|upscale/.test(m))
    return { reply: "To push it more premium: I've deepened and desaturated the palette, and moved the heading toward a high-contrast serif. Expect more whitespace, fewer colors on screen at once, thinner icon strokes and slower transitions. Check the Direction tab for the result.", action: { type: "more-premium" } };
  if (/font|typeface|typograph|pairing/.test(m)) {
    const sameMood = FONTS.filter((f) => f.name !== d.fonts.heading && f.category !== "monospace" && f.moods.some((x) => project.profile.visualMood.some((v) => v.toLowerCase().startsWith(x.slice(0, 4))))).slice(0, 3);
    return { reply: `For "${d.name}" I'd keep ${d.fonts.heading} + ${d.fonts.body}. ${explainPairing(d.fonts.heading, d.fonts.body)} Alternatives from the catalog to test: ${sameMood.map((f) => f.name).join(", ") || "none matched"}. Open the Typography tab to preview them with your own text.`, action: { type: "goto", tab: "typography" } };
  }
  if (/why.*(colou?r|palette)|explain.*(colou?r|palette)|colou?rs? (work|go)/.test(m)) {
    const c = d.palette.colors;
    return { reply: `${d.palette.harmony}: ${d.palette.mood} Text/background contrast is ${contrast(c.text, c.background).toFixed(1)}:1 and primary/background is ${contrast(c.primary, c.background).toFixed(1)}:1.`, action: { type: "goto", tab: "colors" } };
  }
  if (/brief|handoff|hand-off|developer/.test(m))
    return { reply: "The developer-ready brief, CSS variables and tokens are ready in the Handoff tab — everything is copyable.", action: { type: "goto", tab: "handoff" } };
  if (/reference|similar|inspiration|website|competitor/.test(m))
    return { reply: "I can't browse the web without a search API configured, but the References tab builds search links on Dribbble, Behance, Awwwards and others from your project's keywords. If a Brave Search key is set, it also shows real ranked web results.", action: { type: "goto", tab: "references" } };
  if (/icon/.test(m))
    return { reply: `For ${d.name} I'd use ${d.iconStyle.toLowerCase()}. Lucide, Phosphor and Tabler all have free, consistent sets — see the Assets tab.`, action: { type: "goto", tab: "assets" } };
  if (/hero|layout/.test(m))
    return { reply: `Hero idea for ${d.name}: ${d.uiInspiration[0]}. Pair it with ${d.fonts.heading} at a very large size, one primary call-to-action in ${d.palette.colors.primary}, and ${d.imageStyle.split(",")[0].toLowerCase()}.`, action: { type: "none" } };
  if (/moodboard/.test(m))
    return { reply: "Open the Moodboard tab — use 'New from direction' to rebuild it from your selected direction, then drag cards to rearrange.", action: { type: "goto", tab: "moodboard" } };
  return { reply: `I can help with: alternative palettes, font pairings, making the direction more premium, explaining the colors, a developer brief, icons, a hero layout, or the moodboard. (This is the offline assistant; set GEMINI_API_KEY on the server for open-ended AI answers.)`, action: { type: "none" } };
}

export const briefFor = designBrief;
