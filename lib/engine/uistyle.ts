import { ARCHETYPES } from "./taxonomy";
import type { Direction } from "../types";

export type LayoutVariant = "centered" | "editorial" | "organic" | "blocks" | "bento" | "soft" | "split" | "badge" | "dark" | "ornate";

export interface UiStyle {
  layout: LayoutVariant;
  radius: number;          // px
  border: string;          // css border width + style
  shadow: string;          // css box-shadow (token colour added by consumer)
  density: "airy" | "comfortable" | "compact";
  buttons: string;
  motion: string;
  traits: string[];        // plain-language characteristics shown on the card
}

const BY_ARCHETYPE: Record<string, UiStyle> = {
  "minimal-luxury": { layout: "centered", radius: 2, border: "1px solid", shadow: "none", density: "airy", buttons: "Thin outline or solid, uppercase labels, wide letter-spacing", motion: "Slow fades (300–500ms)", traits: ["Hairline dividers", "Very generous whitespace", "One focal element per screen"] },
  "bold-editorial": { layout: "editorial", radius: 0, border: "2px solid", shadow: "none", density: "comfortable", buttons: "Sharp-cornered solid blocks, heavy weight", motion: "Snappy, directional reveals", traits: ["Oversized headlines", "Numbered sections and rules", "Hard contrast, square corners"] },
  "modern-organic": { layout: "organic", radius: 22, border: "1px solid", shadow: "0 8px 24px -12px", density: "comfortable", buttons: "Soft pill buttons, warm fills", motion: "Gentle easing, soft scale", traits: ["Rounded, blob-shaped media", "Warm paper backgrounds", "Soft layered cards"] },
  "playful-vibrant": { layout: "blocks", radius: 16, border: "2px solid", shadow: "4px 4px 0", density: "comfortable", buttons: "Chunky pills with offset shadow", motion: "Bouncy micro-interactions", traits: ["Color-blocked sections", "Sticker-style badges", "Offset hard shadows"] },
  "tech-precision": { layout: "bento", radius: 8, border: "1px solid", shadow: "none", density: "compact", buttons: "Compact solid, subtle borders", motion: "Fast and functional (120–180ms)", traits: ["Bento grid of features", "Dense but aligned", "Monospace metadata"] },
  "calm-clinical": { layout: "soft", radius: 14, border: "1px solid", shadow: "0 6px 18px -10px", density: "airy", buttons: "Large, friendly, high-contrast labels", motion: "Slow and reassuring", traits: ["Large tap targets", "Soft cards on pale backgrounds", "Reassurance microcopy"] },
  "corporate-trust": { layout: "split", radius: 6, border: "1px solid", shadow: "0 1px 2px", density: "comfortable", buttons: "Solid primary, clear secondary", motion: "Minimal and conservative", traits: ["Proof points up front", "Strict 12-column grid", "Structured comparison tables"] },
  "retro-craft": { layout: "badge", radius: 8, border: "2px solid", shadow: "3px 3px 0", density: "comfortable", buttons: "Stamped buttons with offset shadow", motion: "Light wobble on hover", traits: ["Stamp and badge motifs", "Paper textures", "Warm earthy fills"] },
  "futuristic-neon": { layout: "dark", radius: 10, border: "1px solid", shadow: "0 0 0 1px", density: "comfortable", buttons: "Luminous solid, thin outline secondary", motion: "Atmospheric, scroll-linked", traits: ["Dark canvas", "Luminous accents", "Wide display type"] },
  "heritage-classic": { layout: "ornate", radius: 2, border: "3px double", shadow: "none", density: "airy", buttons: "Understated serif labels, framed", motion: "Measured and formal", traits: ["Symmetrical layouts", "Ornamental dividers", "Deep colors with cream text"] },
};

/** UI characteristics for a direction. AI-written directions have no archetype id, so we match their wording against the archetype keywords. */
export function uiStyleOf(d: Direction): UiStyle {
  if (BY_ARCHETYPE[d.archetype]) return BY_ARCHETYPE[d.archetype];
  const text = `${d.name} ${d.summary} ${d.principles.join(" ")} ${d.logoDirection}`.toLowerCase();
  let best = "corporate-trust", score = 0;
  for (const a of ARCHETYPES) {
    const hits = a.keywords.filter((k) => text.includes(k)).length + a.mood.filter((m) => text.includes(m)).length;
    if (hits > score) { best = a.id; score = hits; }
  }
  return BY_ARCHETYPE[best];
}

export const SPACING_UNIT: Record<UiStyle["density"], number> = { airy: 8, comfortable: 8, compact: 4 };
