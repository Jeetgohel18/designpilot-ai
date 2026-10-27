// Builds the brand profile and a set of genuinely different logo concepts from the project. Local and deterministic:
// no network, no claims about uniqueness, availability or trademarks.
import { contrast } from "../color";
import { FONTS } from "../fonts";
import { newId } from "../engine/palette";
import type { Direction, Project } from "../types";
import { MOTIF_IDS, MOTIFS } from "./motifs";
import { ARCH } from "./render";
import type { ArchetypeId, BrandProfile, ConceptPalette, ConceptSpec, MotifId } from "./types";

const GENERIC = new Set(["website", "app", "application", "design", "modern", "clean", "simple", "user", "product", "new", "premium", "online", "platform"]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const words = (s: string) => s.toLowerCase().match(/[a-z]{3,}/g) ?? [];

export function defaultProfile(p: Project): BrandProfile {
  const pr = p.profile;
  const base = p.name.split(/[·—–|:]/)[0].trim();
  return {
    name: base || "Your brand", industry: pr.industry, audience: pr.audience.split(/[(;]/)[0].trim(),
    personality: pr.brandPersonality.slice(0, 5), values: pr.businessGoals.slice(0, 3), emotions: pr.visualMood.slice(0, 4),
    positioning: pr.summary, differentiators: "", tone: pr.designStyle, constraints: p.settings.constraints ?? "", competitors: "", nameIdeas: [],
  };
}

const SUFFIX = ["ly", "ora", "ia", "wise", "lab", "ful", "ify", "well"];
/** Local name ideas from the brief's own words. Not checked for availability, trademarks or domains. */
export function nameIdeas(p: Project, seed = 0): string[] {
  const roots = [...new Set([...p.profile.keywords, p.profile.niche, p.profile.industry].flatMap(words))].filter((w) => !GENERIC.has(w) && w.length <= 9).slice(0, 6);
  if (!roots.length) return [];
  const out: string[] = [];
  roots.forEach((r, i) => { out.push(cap(r) + SUFFIX[(i + seed) % SUFFIX.length]); if (roots[i + 1]) out.push(cap(r) + roots[i + 1]); });
  out.push(`Maison ${cap(roots[0])}`, `${cap(roots[0])} & Co`);
  return [...new Set(out)].slice(0, 8);
}

const FIT: Record<ArchetypeId, string[]> = {
  wordmark: ["clear", "direct", "friendly", "honest", "approachable", "simple", "everyday"],
  monogram: ["heritage", "trust", "professional", "institutional", "studio", "personal", "reliable", "established"],
  geometric: ["tech", "innovative", "smart", "systematic", "data", "software", "structured", "analytical"],
  letterform: ["bold", "confident", "expressive", "creative", "energetic", "striking", "media"],
  negative: ["clever", "playful", "witty", "compact", "mobile", "app", "curious", "youthful"],
  emblem: ["heritage", "craft", "traditional", "artisan", "authentic", "community", "food", "coffee", "organic", "natural"],
  combo: ["balanced", "versatile", "trusted", "commerce", "retail", "shop", "marketplace", "warm"],
  minimal: ["minimal", "calm", "quiet", "refined", "wellness", "serene", "restrained", "clean", "health"],
  editorial: ["luxury", "elegant", "sophisticated", "fashion", "editorial", "beauty", "skincare", "refined", "luxurious", "exclusive"],
  technical: ["futuristic", "technical", "precise", "developer", "ai", "security", "fintech", "saas", "cyber", "engineering"],
};
const MOTIF_FIT: Record<MotifId, string[]> = {
  orbit: ["community", "connection", "social", "network", "focus", "family"], petal: ["organic", "natural", "growth", "care", "beauty", "skincare", "garden", "wellness"],
  stack: ["system", "structure", "software", "finance", "layers", "productivity"], quarters: ["craft", "modular", "design", "architecture", "balance"],
  diamond: ["luxury", "premium", "jewelry", "value", "precision", "finance"], wave: ["water", "flow", "travel", "ocean", "movement", "music", "calm"],
  peak: ["outdoor", "adventure", "ambition", "fitness", "mountain", "sport"], spark: ["idea", "creative", "education", "energy", "playful", "light", "innovation"],
};
const hash = (s: string) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

function haystack(p: Project, profile: BrandProfile): string[] {
  return words([...profile.personality, ...profile.values, ...profile.emotions, profile.industry, profile.tone, p.profile.projectType, p.profile.niche, p.profile.visualMood.join(" "), p.profile.keywords.join(" ")].join(" "));
}

const TEXT_ONLY: ArchetypeId[] = ["wordmark", "editorial"], LETTER: ArchetypeId[] = ["monogram", "letterform", "negative", "emblem"], SYMBOL: ArchetypeId[] = ["geometric", "combo", "minimal", "technical"];

export function chooseArchetypes(p: Project, profile: BrandProfile, seed: number, count = 6): ArchetypeId[] {
  const hay = haystack(p, profile);
  const ids = Object.keys(ARCH) as ArchetypeId[];
  const scored = ids.map((id) => ({ id, s: FIT[id].filter((k) => hay.some((w) => w === k || w.startsWith(k))).length + (hash(id + seed) % 100) / 1000 })).sort((a, b) => b.s - a.s);
  const pick = scored.slice(0, count).map((x) => x.id);
  const groupOf = (id: ArchetypeId) => (TEXT_ONLY.includes(id) ? 0 : LETTER.includes(id) ? 1 : 2);
  for (const g of [0, 1, 2]) {
    if (pick.some((id) => groupOf(id) === g)) continue;
    const add = scored.find((x) => groupOf(x.id) === g)!.id;
    const counts = [0, 0, 0]; pick.forEach((id) => counts[groupOf(id)]++);
    const drop = [...pick].reverse().find((id) => counts[groupOf(id)] > 1);
    if (drop) pick[pick.indexOf(drop)] = add;
  }
  return pick;
}

export function chooseMotif(p: Project, profile: BrandProfile, seed: number, taken: MotifId[]): MotifId {
  const hay = haystack(p, profile);
  const scored = MOTIF_IDS.map((m) => ({ m, s: MOTIF_FIT[m].filter((k) => hay.some((w) => w.startsWith(k))).length - (taken.includes(m) ? 2 : 0) + (hash(m + seed) % 100) / 1000 })).sort((a, b) => b.s - a.s);
  return scored[0].m;
}

const nearestWeight = (family: string, w: number) => { const f = FONTS.find((x) => x.name === family); return f ? f.weights.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a)) : w; };
const exists = (family: string) => FONTS.some((f) => f.name === family);

function fontFor(a: ArchetypeId, d: Direction): { family: string; weight: number; tracking: number; caps: boolean } {
  const h = exists(d.fonts.heading) ? d.fonts.heading : "Inter", b = exists(d.fonts.body) ? d.fonts.body : "Inter";
  const pick = (family: string, weight: number, tracking: number, caps: boolean) => ({ family, weight: nearestWeight(family, weight), tracking, caps });
  switch (a) {
    case "wordmark": return pick(h, 600, -0.01, false);
    case "monogram": return pick(h, 500, 0.02, false);
    case "geometric": return pick("Outfit", 600, 0, false);
    case "letterform": return pick(h, 700, 0, false);
    case "negative": return pick("Manrope", 800, -0.01, false);
    case "emblem": return pick("Cinzel", 600, 0.12, true);
    case "combo": return pick(b, 600, 0, false);
    case "minimal": return pick("Jost", 400, 0.04, false);
    case "editorial": return pick("Bodoni Moda", 500, 0.22, true);
    case "technical": return pick("Space Grotesk", 600, 0.06, true);
  }
}

function paletteFor(d: Direction, i: number): ConceptPalette {
  const c = d.palette.colors, bg = c.background;
  const inks = [c.primary, c.text, c.secondary, c.primary], accs = [c.accent, c.secondary, c.accent, c.primary];
  let ink = inks[i % inks.length]; if (contrast(ink, bg) < 3.5) ink = contrast(c.text, bg) >= 3.5 ? c.text : c.primary;
  let accent = accs[i % accs.length]; if (accent.toLowerCase() === ink.toLowerCase() || contrast(accent, bg) < 2.2) accent = [c.accent, c.secondary, c.primary].find((x) => x.toLowerCase() !== ink.toLowerCase() && contrast(x, bg) >= 2.2) ?? ink;
  let deep = contrast(c.text, bg) >= 7 && contrast(c.text, "#ffffff") >= 7 ? c.text : c.primary;
  if (contrast(bg, deep) < 4.5) deep = "#111111";
  return { ink, accent, bg, deep };
}

export const initialsOf = (name: string): string => { const w = name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean); return (w.length > 1 ? w.slice(0, 2).map((x) => x[0]).join("") : (w[0] ?? "B").slice(0, 1)).toUpperCase(); };

export function makeConcept(p: Project, profile: BrandProfile, d: Direction, arch: ArchetypeId, seed: number, i: number, taken: MotifId[]): ConceptSpec {
  const f = fontFor(arch, d);
  return { id: newId("lg"), archetype: arch, motif: chooseMotif(p, profile, seed + i, taken), seed: hash(arch + seed + i) % 997, name: profile.name, initials: initialsOf(profile.name), font: { family: f.family, weight: f.weight }, tracking: f.tracking, caps: f.caps, palette: paletteFor(d, i) };
}

/** Regenerates concepts, keeping pinned ones. */
export function generateConcepts(p: Project, profile: BrandProfile, d: Direction, seed: number, keep: ConceptSpec[] = [], count = 6): ConceptSpec[] {
  const pinned = keep.filter((c) => c.pinned).map((c) => ({ ...c, name: profile.name, initials: initialsOf(profile.name) }));
  const used = new Set(pinned.map((c) => c.archetype));
  const order = chooseArchetypes(p, profile, seed, count + used.size).filter((a) => !used.has(a)).slice(0, Math.max(0, count - pinned.length));
  const taken: MotifId[] = pinned.map((c) => c.motif);
  const fresh = order.map((a, i) => { const c = makeConcept(p, profile, d, a, seed, i + pinned.length, taken); taken.push(c.motif); return c; });
  return [...pinned, ...fresh];
}

export interface Analysis { idea: string; meaning: string; shape: string; type: string; color: string; personality: string; bestUse: string; weakness: string; keywords: string[] }
const list = (a: string[], fallback: string) => (a.length ? a.slice(0, 3).join(", ") : fallback);

export function describe(s: ConceptSpec, profile: BrandProfile): Analysis {
  const traits = list(profile.personality, "the personality you describe"), motif = MOTIFS[s.motif];
  const colors = `${s.palette.ink} (main) with ${s.palette.accent} as the accent, taken from your selected direction's palette.`;
  const T: Record<ArchetypeId, Omit<Analysis, "color" | "keywords">> = {
    wordmark: { idea: `The name “${s.name}” is the logo. Custom spacing and one accent dot give it a signature without a symbol.`, meaning: "Nothing to decode: the name does all the work, which suits a brand people will read before they recognise.", shape: "Soft, even letter shapes with one round accent that echoes the dot of an i or a full stop.", type: `${s.font.family} ${s.font.weight}, slightly tight tracking.`, personality: `Direct and approachable. Fits ${traits}.`, bestUse: "Headers, packaging, signage and anywhere the name needs to be read.", weakness: "No standalone symbol, so small spaces (favicons, avatars) use a compact monogram instead." },
    monogram: { idea: `The initials “${s.initials}” held inside a simple frame, like a seal.`, meaning: "Initials compress a long name into something that fits a favicon, stamp or avatar.", shape: "A single outline frame (circle, rounded square or arch) with centred letters.", type: `${s.font.family} ${s.font.weight} for the letters and the name.`, personality: `Established and calm. Fits ${traits}.`, bestUse: "Avatars, stamps, embossing, app icons and packaging seals.", weakness: "Initials alone say little about what you do, and short initials can resemble other monograms." },
    geometric: { idea: `Symbol: ${motif.noun}, built from basic shapes and placed beside the name.`, meaning: `${motif.meaning} This is a design reading of the shape, not a claim about your business.`, shape: "Flat geometric forms, no outlines, with the accent on a single part.", type: `${s.font.family} ${s.font.weight}, clean and even.`, personality: `Modern and structured. Fits ${traits}.`, bestUse: "Digital products, app icons, social avatars and presentations.", weakness: "Abstract marks need consistent use before people connect them with the brand; check similar marks in your field." },
    letterform: { idea: `The first letter “${s.initials.slice(0, 1)}” set very large as the mark, with one accent shape.`, meaning: "One confident letter is easy to remember and works as a badge.", shape: "A single oversized glyph plus a bar or dot in the accent colour.", type: `${s.font.family} ${s.font.weight} (the mark is the font's own letter).`, personality: `Bold and expressive. Fits ${traits}.`, bestUse: "Social avatars, merchandise, editorial covers and bold headers.", weakness: "Depends on the chosen typeface, so it needs a font licence check before commercial use beyond logo outlines." },
    negative: { idea: `The letter “${s.initials.slice(0, 1)}” cut out of a solid block, so the background shows through it.`, meaning: "Negative space turns the letter into a window and gives the mark weight at small sizes.", shape: "A heavy rounded block with the letter knocked out (a true cut-out, not a coloured letter).", type: `${s.font.family} ${s.font.weight}, a heavy geometric sans.`, personality: `Clever and compact. Fits ${traits}.`, bestUse: "App icons, favicons, stickers and tiny placements.", weakness: "A block mark is heavy next to light layouts and the cut-out letter can lose clarity on busy photos." },
    emblem: { idea: `A double ring around the initial with the name set in capitals below.`, meaning: "Rings and caps borrow the look of seals and labels, which signals care and craft.", shape: "Concentric circles (thick and hairline) with a centred letter.", type: `${s.font.family} ${s.font.weight} in capitals with wide spacing.`, personality: `Crafted and traditional. Fits ${traits}.`, bestUse: "Labels, packaging, stamps and badges.", weakness: "Fine rings can disappear when small; use the symbol-only version above its minimum size." },
    combo: { idea: `Symbol: ${motif.noun}, beside a friendly wordmark. Built to be used together or apart.`, meaning: motif.meaning, shape: "Simple filled forms balanced against the name.", type: `${s.font.family} ${s.font.weight}.`, personality: `Balanced and versatile. Fits ${traits}.`, bestUse: "Websites, apps, stationery: the most flexible lockup.", weakness: "A balanced mark can feel safe; it relies on your colours and imagery for personality." },
    minimal: { idea: "A solid dot with an open ring, and the name in a light weight.", meaning: "An open ring suggests something still in motion; the dot gives it a focal point.", shape: "One filled circle and one open arc, nothing else.", type: `${s.font.family} ${s.font.weight}, light and wide.`, personality: `Quiet and refined. Fits ${traits}.`, bestUse: "Premium, wellness and editorial settings with lots of white space.", weakness: "So reduced that it can look generic; strong photography and copy have to carry the brand." },
    editorial: { idea: "A high-contrast serif wordmark in capitals between two fine rules.", meaning: "Wide-spaced capitals and hairlines are the language of magazines and luxury packaging.", shape: "Thin and thick strokes with hairline rules above and below.", type: `${s.font.family} ${s.font.weight}, capitals, wide tracking.`, personality: `Elegant and sophisticated. Fits ${traits}.`, bestUse: "Packaging, print, large headers and high-end e-commerce.", weakness: "Hairlines and thin strokes fail at small sizes, so there is no true symbol; the compact monogram covers small spaces." },
    technical: { idea: "A small pixel-grid symbol and a capital wordmark held in corner brackets.", meaning: "A grid of cells and brackets reads as code, data and precision.", shape: "Square cells with small radii and square brackets.", type: `${s.font.family} ${s.font.weight}, capitals, open spacing.`, personality: `Precise and futuristic. Fits ${traits}.`, bestUse: "Developer tools, dashboards, fintech and AI products.", weakness: "Strongly tied to tech visual language; it will feel out of place for warm or craft brands." },
  };
  const t = T[s.archetype];
  return { ...t, color: colors, keywords: [...new Set([ARCH[s.archetype].label.toLowerCase(), ...profile.personality.slice(0, 2).map((x) => x.toLowerCase()), MOTIFS[s.motif].label.toLowerCase()])] };
}
