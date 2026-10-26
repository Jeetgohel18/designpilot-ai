import { z } from "zod";
import { FONTS, explainPairing, fontByName } from "../fonts";
import { normalizeHex } from "../color";
import type { Direction, Palette, ProjectProfile, ProjectSettings, Project } from "../types";
import { ROLES } from "../types";
import { ARCHETYPES, AUDIENCE_PATTERNS, COLOR_WORDS, INDUSTRIES, type Archetype, type Industry } from "./taxonomy";
import { gradientsFor, makePalette, newId, type PaletteSpec } from "./palette";

const STOP = new Set("a an and the for to of in on with that this who is are be i we want build create make my our your website site app application platform targeting target using use like very more with into about from have has will can should could would not need needs also its it their they them as at by or if so than then which what when where how distinctive experience aesthetic really just some many much well".split(" "));

export function extractKeywords(text: string, limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)) {
    if (w.length < 4 || STOP.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, limit).map(([w]) => w);
}

export function detectIndustry(brief: string, override?: string): Industry {
  if (override) {
    const byLabel = INDUSTRIES.find((i) => i.label.toLowerCase() === override.toLowerCase() || i.id === override.toLowerCase());
    if (byLabel) return byLabel;
  }
  const t = brief.toLowerCase();
  let best = INDUSTRIES[INDUSTRIES.length - 1], bestScore = 0;
  for (const ind of INDUSTRIES) {
    // "E-commerce" describes a project type more than an industry, so it only wins when nothing more specific matches.
    const weight = ind.id === "ecommerce" ? 0.4 : 1;
    const score = weight * ind.keywords.reduce((s, k) => s + (t.includes(k) ? (k.length > 5 ? 2 : 1) : 0), 0);
    if (score > bestScore) { best = ind; bestScore = score; }
  }
  return best;
}

function detectProjectType(t: string): string {
  if (/e-?commerce|online store|shop\b|checkout|store/.test(t)) return "E-commerce website";
  if (/dashboard|admin|analytics/.test(t)) return "Web application / dashboard";
  if (/mobile app|ios|android|\bapp\b/.test(t)) return "Mobile application";
  if (/portfolio/.test(t)) return "Portfolio website";
  if (/landing/.test(t)) return "Marketing landing page";
  if (/brand identity|rebrand|logo/.test(t)) return "Brand identity";
  if (/saas|platform|software/.test(t)) return "SaaS product & marketing site";
  return "Website";
}

function detectPlatforms(t: string, settings: ProjectSettings): string[] {
  const p = new Set<string>();
  if (settings.platform) p.add(settings.platform);
  if (/mobile[- ]first|mobile/.test(t)) p.add("Mobile-first responsive web");
  if (/\bios\b|android|native app|mobile app/.test(t)) p.add("Native mobile (iOS / Android)");
  if (/dashboard|desktop|saas|admin/.test(t)) p.add("Desktop web application");
  if (!p.size || /website|site|e-?commerce|landing/.test(t)) p.add("Responsive website (mobile, tablet, desktop)");
  return [...p];
}

export function analyzeLocal(brief: string, settings: ProjectSettings = {}): { profile: ProjectProfile; directions: Direction[] } {
  const t = (brief + " " + (settings.style ?? "") + " " + (settings.audience ?? "")).toLowerCase();
  const industry = detectIndustry(brief, settings.industry);
  const matched = ARCHETYPES.map((a) => ({ a, hits: a.keywords.filter((k) => t.includes(k)) }));
  const audience = settings.audience || AUDIENCE_PATTERNS.find(([re]) => re.test(brief))?.[1] || industry.audience;

  // Transparent scoring: 3 points per brief/style keyword hit, plus an industry-affinity bonus (4,3,2,1 by rank).
  const scored = matched.map(({ a, hits }) => {
    const rank = industry.archetypes.indexOf(a.id);
    const affinity = rank === -1 ? 0 : 4 - rank;
    return { a, hits, score: hits.length * 3 + affinity };
  }).sort((x, y) => y.score - x.score);
  const top = scored.slice(0, 3);

  const colorWord = COLOR_WORDS.find(([re]) => re.test(brief));
  const moods = [...new Set(top.flatMap((s) => s.a.mood))].slice(0, 5);
  // Domain terms (e.g. "skincare") first: they make far better search queries than generic frequent words.
  const domain = industry.keywords.map((k) => k.trim()).filter((k) => k.length > 3 && t.includes(k));
  const keywords = [...new Set([...domain, ...extractKeywords(brief)])].slice(0, 12);
  const budgetNote = settings.budget && /low|free|bootstrap|\$/i.test(settings.budget) ? ["Budget-conscious: prefer open-source type, icons and UI kits"] : [];

  const profile: ProjectProfile = {
    projectType: detectProjectType(t),
    industry: industry.label,
    niche: industry.niche,
    audience,
    userNeeds: industry.needs,
    businessGoals: industry.goals,
    platforms: detectPlatforms(t, settings),
    brandPersonality: [...new Set(top.flatMap((s) => s.a.mood))].slice(0, 4).map((m) => m[0].toUpperCase() + m.slice(1)),
    visualMood: moods,
    designStyle: top.map((s) => s.a.name).join(" · "),
    typography: top[0].a.fonts.heading.length ? `${fontByName(top[0].a.fonts.heading)?.character ?? "Distinctive headings"}; body set in a readable ${fontByName(top[0].a.fonts.body)?.category ?? "sans-serif"}` : "",
    colorDirection: colorWord ? `Built around the ${colorWord[0].source.match(/\w+/)?.[0]} direction mentioned in your brief, balanced with neutrals` : `Palettes derived from the leading direction (${top[0].a.name}): ${top[0].a.scheme} harmony`,
    imageDirection: top[0].a.imageStyle,
    keywords,
    challenges: [...industry.challenges, ...budgetNote],
    summary: `${detectProjectType(t)} in ${industry.label.toLowerCase()} for ${audience}. Strongest style signals: ${top[0].hits.length ? top[0].hits.join(", ") : "none stated — using industry defaults"}.`,
  };

  const directions = top.map(({ a, hits }, i) => buildDirection(a, industry, { hueOverride: colorWord?.[1], satOverride: colorWord?.[2], index: i, why: hits.length ? `Matched your brief on: ${hits.join(", ")}.` : `Suggested as a strong fit for ${industry.label.toLowerCase()} (industry affinity).` }));
  return { profile, directions };
}

export function buildDirection(a: Archetype, industry: Industry, o: { hueOverride?: number; satOverride?: number; index?: number; why?: string; keepId?: string; shift?: number } = {}): Direction {
  const spec: PaletteSpec = {
    name: `${a.name} palette`,
    hue: ((o.hueOverride !== undefined && (o.index ?? 0) === 0 ? o.hueOverride : a.hue + (o.shift ?? 0)) + 360) % 360,
    sat: o.satOverride !== undefined && (o.index ?? 0) === 0 ? o.satOverride : a.sat,
    scheme: a.scheme, tone: a.tone, depth: a.depth,
  };
  const palette = makePalette(spec);
  const idx = o.index ?? 0;
  const brands = [...industry.brands.slice(idx * 2), ...industry.brands].slice(0, 3);
  return {
    id: o.keepId ?? newId("dir"),
    archetype: a.id,
    name: a.name,
    summary: `${a.blurb} ${o.why ?? ""}`.trim(),
    palette,
    fonts: a.fonts,
    fontRationale: explainPairing(a.fonts.heading, a.fonts.body),
    imageStyle: a.imageStyle, illustrationStyle: a.illustrationStyle, iconStyle: a.iconStyle, logoDirection: a.logoDirection,
    uiInspiration: a.uiInspiration, principles: a.principles,
    components: industry.components.slice(0, 6),
    brandReferences: brands,
  };
}

/** Regenerate ONE direction: same archetype family, shifted hue and an alternative font pairing from the catalog. */
export function regenerateDirection(project: Project, directionId: string, rand: () => number = Math.random): Direction {
  const prev = project.directions.find((d) => d.id === directionId)!;
  const industry = detectIndustry(project.brief, project.settings.industry);
  const a = ARCHETYPES.find((x) => x.id === prev.archetype) ?? ARCHETYPES[0];
  const d = buildDirection(a, industry, { keepId: prev.id, shift: Math.round((rand() - 0.5) * 80), index: project.directions.indexOf(prev), why: "Regenerated with a new hue and font pairing." });
  // Pick an alternative pairing sharing at least one mood with the archetype.
  const heads = FONTS.filter((f) => f.category === "serif" || f.category === "display" || f.category === "sans-serif").filter((f) => f.moods.some((m) => a.mood.includes(m) || a.keywords.some((k) => k.startsWith(m)))).filter((f) => f.name !== prev.fonts.heading);
  const bodies = FONTS.filter((f) => f.readability === "high" && f.category !== "monospace" && f.name !== prev.fonts.body);
  if (heads.length && bodies.length) {
    const heading = heads[Math.floor(rand() * heads.length)].name;
    const body = bodies[Math.floor(rand() * bodies.length)].name;
    d.fonts = { ...a.fonts, heading, body };
    d.fontRationale = explainPairing(heading, body);
  }
  return d;
}

// ---------- AI output validation (used by /api/analyze when GEMINI_API_KEY is set) ----------
const hex = z.string().transform((s, ctx) => { const h = normalizeHex(s); if (!h) { ctx.addIssue({ code: "custom", message: "bad hex" }); return z.NEVER; } return h; });
const str = z.string().min(1).max(600);
const list = (n = 8) => z.array(str).min(1).max(n);

export const aiResultSchema = z.object({
  profile: z.object({
    projectType: str, industry: str, niche: str, audience: str, userNeeds: list(), businessGoals: list(), platforms: list(), brandPersonality: list(),
    visualMood: list(), designStyle: str, typography: str, colorDirection: str, imageDirection: str, keywords: list(14), challenges: list(), summary: str,
  }),
  directions: z.array(z.object({
    name: str, summary: str, harmony: str, paletteName: str, paletteReasoning: str,
    colors: z.object(Object.fromEntries(ROLES.map((r) => [r, hex])) as Record<(typeof ROLES)[number], typeof hex>),
    headingFont: str, bodyFont: str, fontRationale: str,
    imageStyle: str, illustrationStyle: str, iconStyle: str, logoDirection: str,
    uiInspiration: list(), principles: list(), components: list(), brandReferences: list(),
  })).length(3),
});
export type AiResult = z.infer<typeof aiResultSchema>;

export function fromAi(r: AiResult): { profile: ProjectProfile; directions: Direction[] } {
  const directions: Direction[] = r.directions.map((d) => {
    const colors = d.colors as Palette["colors"];
    const palette: Palette = { id: newId("pal"), name: d.paletteName, harmony: d.harmony, mood: d.paletteReasoning, colors, locked: [], gradients: gradientsFor(colors) };
    return {
      id: newId("dir"), archetype: "ai", name: d.name, summary: d.summary, palette,
      fonts: { heading: d.headingFont, body: d.bodyFont }, fontRationale: d.fontRationale,
      imageStyle: d.imageStyle, illustrationStyle: d.illustrationStyle, iconStyle: d.iconStyle, logoDirection: d.logoDirection,
      uiInspiration: d.uiInspiration, principles: d.principles, components: d.components, brandReferences: d.brandReferences,
    };
  });
  return { profile: r.profile, directions };
}
