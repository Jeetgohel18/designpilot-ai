// Brand identity studio: serializable specs. Artwork is always regenerated from these, never stored as raw SVG.
export type ArchetypeId = "wordmark" | "monogram" | "geometric" | "letterform" | "negative" | "emblem" | "combo" | "minimal" | "editorial" | "technical";
export type MotifId = "orbit" | "petal" | "stack" | "quarters" | "diamond" | "wave" | "peak" | "spark";
export type Layout = "primary" | "horizontal" | "stacked" | "symbol" | "wordmark";
export type Scheme = "full" | "reversed" | "black" | "white";

export interface BrandProfile {
  name: string; industry: string; audience: string;
  personality: string[]; values: string[]; emotions: string[];
  positioning: string; differentiators: string; tone: string; constraints: string; competitors: string;
  /** Local, unverified name ideas (never checked for availability or trademarks). */
  nameIdeas: string[];
}

export interface ConceptPalette { ink: string; accent: string; bg: string; deep: string }
export interface ConceptSpec {
  id: string; archetype: ArchetypeId; motif: MotifId; seed: number;
  name: string; initials: string;
  font: { family: string; weight: number }; tracking: number; caps: boolean;
  palette: ConceptPalette;
  pinned?: boolean;
}

export interface BrandState {
  profile: BrandProfile;
  concepts: ConceptSpec[];
  selected: string | null;
  seed: number;
  updatedAt: number;
}
