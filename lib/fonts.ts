// Curated catalog of real Google Fonts. Mood/industry tags are OUR editorial judgement
// (labelled "curated"), not Google metadata. Live popularity comes from /api/fonts when
// GOOGLE_FONTS_API_KEY is configured.
export type FontCategory = "serif" | "sans-serif" | "display" | "monospace" | "handwriting";
export interface FontEntry {
  name: string;
  category: FontCategory;
  weights: number[];
  italic?: boolean;
  moods: string[];
  industries: string[];
  readability: "high" | "medium" | "display-only";
  character: string;
}

export const FONTS: FontEntry[] = [
  { name: "Cormorant Garamond", category: "serif", weights: [300, 400, 500, 600, 700], italic: true, moods: ["luxury", "elegant", "editorial"], industries: ["beauty", "fashion", "hospitality"], readability: "medium", character: "High-contrast, delicate, fashion-magazine elegance" },
  { name: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900], italic: true, moods: ["editorial", "luxury", "bold"], industries: ["fashion", "media", "beauty"], readability: "medium", character: "Dramatic transitional serif with sharp contrast" },
  { name: "Fraunces", category: "serif", weights: [300, 400, 500, 600, 700, 800], italic: true, moods: ["organic", "warm", "playful"], industries: ["food", "wellness", "beauty"], readability: "high", character: "Soft, wonky old-style serif with personality" },
  { name: "DM Serif Display", category: "serif", weights: [400], italic: true, moods: ["editorial", "luxury", "confident"], industries: ["media", "beauty", "hospitality"], readability: "display-only", character: "Chunky, high-contrast display serif" },
  { name: "Lora", category: "serif", weights: [400, 500, 600, 700], italic: true, moods: ["warm", "editorial", "calm"], industries: ["media", "education", "wellness"], readability: "high", character: "Well-balanced contemporary serif for long reading" },
  { name: "Newsreader", category: "serif", weights: [300, 400, 500, 600, 700], italic: true, moods: ["editorial", "calm", "intellectual"], industries: ["media", "education", "saas"], readability: "high", character: "Text serif designed for on-screen news reading" },
  { name: "Instrument Serif", category: "serif", weights: [400], italic: true, moods: ["editorial", "modern", "luxury"], industries: ["saas", "media", "fashion"], readability: "display-only", character: "Condensed, characterful modern display serif" },
  { name: "Source Serif 4", category: "serif", weights: [300, 400, 500, 600, 700], italic: true, moods: ["calm", "intellectual", "corporate"], industries: ["education", "finance", "media"], readability: "high", character: "Neutral, highly legible text serif" },
  { name: "Inter", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["neutral", "modern", "technical"], industries: ["saas", "finance", "general"], readability: "high", character: "Neutral UI workhorse, excellent at small sizes" },
  { name: "DM Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["friendly", "modern", "minimal"], industries: ["beauty", "saas", "wellness"], readability: "high", character: "Low-contrast geometric sans, clean and approachable" },
  { name: "Manrope", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800], moods: ["modern", "technical", "minimal"], industries: ["saas", "finance", "general"], readability: "high", character: "Semi-condensed modern sans with crisp geometry" },
  { name: "Plus Jakarta Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800], moods: ["friendly", "modern", "confident"], industries: ["saas", "finance", "education"], readability: "high", character: "Friendly geometric sans with open forms" },
  { name: "Outfit", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["playful", "modern", "minimal"], industries: ["beauty", "gaming", "general"], readability: "high", character: "Geometric, rounded-feeling, youthful" },
  { name: "Space Grotesk", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["technical", "bold", "futuristic"], industries: ["saas", "gaming", "web3"], readability: "high", character: "Quirky grotesk with technical, retro-future details" },
  { name: "Sora", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["futuristic", "modern", "technical"], industries: ["saas", "finance", "web3"], readability: "high", character: "Wide, clean sans with a digital feel" },
  { name: "Syne", category: "sans-serif", weights: [400, 500, 600, 700, 800], moods: ["bold", "editorial", "creative"], industries: ["fashion", "agency", "media"], readability: "medium", character: "Expressive, wide-bold grotesk for art & culture" },
  { name: "Work Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["neutral", "friendly", "corporate"], industries: ["general", "education", "finance"], readability: "high", character: "Grotesque-inspired, great for body and UI" },
  { name: "Jost", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["minimal", "luxury", "modern"], industries: ["fashion", "beauty", "hospitality"], readability: "high", character: "Futura-inspired geometric sans, clean and airy" },
  { name: "Figtree", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["friendly", "modern", "calm"], industries: ["wellness", "education", "saas"], readability: "high", character: "Friendly, simple geometric sans" },
  { name: "Nunito Sans", category: "sans-serif", weights: [300, 400, 600, 700], moods: ["friendly", "calm", "warm"], industries: ["wellness", "education", "food"], readability: "high", character: "Soft, balanced sans for approachable products" },
  { name: "Poppins", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["playful", "friendly", "bold"], industries: ["general", "food", "education"], readability: "high", character: "Geometric sans, round and highly recognisable" },
  { name: "Urbanist", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["minimal", "modern", "luxury"], industries: ["beauty", "fashion", "saas"], readability: "high", character: "Low-contrast geometric sans with a quiet, modern tone" },
  { name: "Bricolage Grotesque", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800], moods: ["bold", "playful", "editorial"], industries: ["agency", "food", "media"], readability: "medium", character: "Characterful grotesque with ink-trap quirks" },
  { name: "Unbounded", category: "display", weights: [300, 400, 500, 600, 700], moods: ["bold", "futuristic", "playful"], industries: ["gaming", "web3", "agency"], readability: "display-only", character: "Wide, rounded display type, loud and modern" },
  { name: "Bebas Neue", category: "display", weights: [400], moods: ["bold", "sporty", "confident"], industries: ["sports", "media", "gaming"], readability: "display-only", character: "Tall, all-caps poster headline face" },
  { name: "Abril Fatface", category: "display", weights: [400], moods: ["bold", "editorial", "luxury"], industries: ["fashion", "food", "media"], readability: "display-only", character: "Fat-face Didone for posters and mastheads" },
  { name: "Cinzel", category: "display", weights: [400, 500, 600, 700], moods: ["luxury", "classic", "elegant"], industries: ["hospitality", "beauty", "legal"], readability: "display-only", character: "Roman inscriptional capitals, stately" },
  { name: "Space Mono", category: "monospace", weights: [400, 700], italic: true, moods: ["technical", "retro", "bold"], industries: ["saas", "web3", "gaming"], readability: "medium", character: "Quirky geometric monospace" },
  { name: "JetBrains Mono", category: "monospace", weights: [300, 400, 500, 600, 700], moods: ["technical", "modern"], industries: ["saas", "developer"], readability: "high", character: "Made for code, tall x-height" },
  { name: "IBM Plex Mono", category: "monospace", weights: [300, 400, 500, 600, 700], italic: true, moods: ["technical", "corporate"], industries: ["saas", "finance", "developer"], readability: "high", character: "Engineered, neutral monospace" },
  { name: "Caveat", category: "handwriting", weights: [400, 500, 600, 700], moods: ["playful", "warm", "personal"], industries: ["food", "wellness", "education"], readability: "medium", character: "Casual handwritten script for notes and accents" },
  { name: "Gloria Hallelujah", category: "handwriting", weights: [400], moods: ["playful", "friendly"], industries: ["education", "food"], readability: "medium", character: "Marker-style handwriting" },
  { name: "Playwrite US Trad", category: "handwriting", weights: [300, 400], moods: ["classic", "personal", "elegant"], industries: ["education", "hospitality"], readability: "medium", character: "Cursive school-hand model" },
  { name: "Epilogue", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800], moods: ["editorial", "bold", "modern"], industries: ["media", "agency", "fashion"], readability: "high", character: "Weighty grotesque with editorial presence" },
  { name: "Libre Franklin", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["corporate", "editorial", "neutral"], industries: ["finance", "media", "general"], readability: "high", character: "Interpretation of classic Franklin Gothic" },
  { name: "Crimson Pro", category: "serif", weights: [300, 400, 500, 600, 700], italic: true, moods: ["classic", "calm", "intellectual"], industries: ["education", "media", "legal"], readability: "high", character: "Old-style serif for text-heavy layouts" },
  { name: "Young Serif", category: "serif", weights: [400], moods: ["warm", "organic", "bold"], industries: ["food", "wellness", "media"], readability: "display-only", character: "Heavy, friendly old-style serif" },
  { name: "Bodoni Moda", category: "serif", weights: [400, 500, 600, 700, 800, 900], italic: true, moods: ["luxury", "editorial", "fashion"], industries: ["fashion", "beauty"], readability: "display-only", character: "Hairline-contrast Didone for high fashion" },
  { name: "Karla", category: "sans-serif", weights: [300, 400, 500, 600, 700], moods: ["friendly", "organic", "calm"], industries: ["wellness", "food", "beauty"], readability: "high", character: "Quirky grotesque, warm and compact" },
];

export const fontByName = (n: string) => FONTS.find((f) => f.name.toLowerCase() === n.toLowerCase());

const q = (n: string) => n.replace(/ /g, "+");

/** Google Fonts CSS2 URL for a set of families (weights from the catalog; falls back to 400;700). */
export function googleFontsUrl(names: string[], lite = false): string {
  const fam = [...new Set(names)].map((n) => {
    const f = fontByName(n);
    let w = f ? f.weights : [400, 700];
    if (lite) { const l = w.filter((x) => x === 400 || x === 700); w = l.length ? l : [w[0]]; }
    return `family=${q(n)}:wght@${w.join(";")}`;
  });
  return `https://fonts.googleapis.com/css2?${fam.join("&")}&display=swap`;
}

export function fallbackStack(name: string): string {
  const f = fontByName(name);
  switch (f?.category) {
    case "serif": return "Georgia, 'Times New Roman', serif";
    case "monospace": return "ui-monospace, 'SF Mono', Menlo, monospace";
    case "handwriting": return "'Comic Sans MS', cursive";
    case "display": return "Impact, system-ui, sans-serif";
    default: return "system-ui, -apple-system, 'Segoe UI', sans-serif";
  }
}

export const fontFamilyCss = (name: string) => `'${name}', ${fallbackStack(name)}`;

/** Generated explanation of why two catalog fonts pair — derived from metadata, labelled "generated". */
export function explainPairing(heading: string, body: string): string {
  const h = fontByName(heading), b = fontByName(body);
  if (!h || !b) return "Custom pairing — check contrast between heading and body in the live preview.";
  const parts: string[] = [];
  if (h.category !== b.category) parts.push(`${h.category} headings against a ${b.category} body create clear hierarchy through contrast`);
  else parts.push(`both are ${h.category} faces, so the pairing stays cohesive — hierarchy comes from weight and scale`);
  const shared = h.moods.filter((m) => b.moods.includes(m));
  if (shared.length) parts.push(`they share a ${shared.join(" / ")} tone`);
  parts.push(`${h.name} brings ${h.character.toLowerCase()}; ${b.name} keeps body text ${b.readability === "high" ? "highly readable" : "readable"}`);
  if (h.readability === "display-only") parts.push(`use ${h.name} at large sizes only`);
  return parts.join("; ") + ".";
}

export function cssSnippet(f: { heading: string; body: string; mono?: string }): string {
  const fams = [f.heading, f.body, ...(f.mono ? [f.mono] : [])];
  return `/* Fonts */\n@import url('${googleFontsUrl(fams)}');\n\n:root {\n  --font-heading: ${fontFamilyCss(f.heading)};\n  --font-body: ${fontFamilyCss(f.body)};${f.mono ? `\n  --font-mono: ${fontFamilyCss(f.mono)};` : ""}\n}\n\nh1, h2, h3 { font-family: var(--font-heading); }\nbody { font-family: var(--font-body); }`;
}

export const linkTag = (names: string[]) =>
  `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="${googleFontsUrl(names)}" rel="stylesheet">`;
