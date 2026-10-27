export type Role = "primary" | "secondary" | "accent" | "background" | "surface" | "text" | "border";
export const ROLES: Role[] = ["primary", "secondary", "accent", "background", "surface", "text", "border"];
export type PaletteColors = Record<Role, string>;

export interface Palette {
  id: string;
  name: string;
  harmony: string;          // e.g. "Analogous"
  mood: string;             // explanation of why the colors work together
  colors: PaletteColors;    // light-theme roles
  locked: Role[];
  gradients: { name: string; css: string }[];
}

export interface FontChoice { heading: string; body: string; mono?: string }

export interface Direction {
  id: string;
  archetype: string;
  name: string;
  summary: string;
  palette: Palette;
  fonts: FontChoice;
  fontRationale: string;
  imageStyle: string;
  illustrationStyle: string;
  iconStyle: string;
  logoDirection: string;
  uiInspiration: string[];
  principles: string[];
  components: string[];
  brandReferences: string[];  // brand *names* to research; links are search links, not claims
}

export interface ProjectSettings {
  industry?: string;
  audience?: string;
  platform?: string;
  style?: string;
  budget?: string;
  constraints?: string;
}

export interface ProjectProfile {
  projectType: string;
  industry: string;
  niche: string;
  audience: string;
  userNeeds: string[];
  businessGoals: string[];
  platforms: string[];
  brandPersonality: string[];
  visualMood: string[];
  designStyle: string;
  typography: string;
  colorDirection: string;
  imageDirection: string;
  keywords: string[];
  challenges: string[];
  summary: string;
}

export type Source = "ai" | "local";

export interface Bookmark { id: string; kind: "reference" | "font" | "palette" | "icon" | "asset"; title: string; url?: string; note?: string; source?: string; at: number }

export type MoodItem =
  | { id: string; type: "swatch"; hex: string; label: string }
  | { id: string; type: "type"; heading: string; body: string; sample: string }
  | { id: string; type: "note"; text: string }
  | { id: string; type: "link"; title: string; url: string; source: string }
  | { id: string; type: "tag"; text: string; group: string };

export interface Moodboard { id: string; name: string; directionId: string; items: MoodItem[]; updatedAt: number; share?: Share }

export interface Share { token: string; ownerKey: string; enabled: boolean; kind: "project" | "moodboard"; createdAt: number }

export type IdeaGroup = "Problems" | "Opportunities" | "Features" | "User needs" | "Visual ideas" | "Open questions";
export const IDEA_GROUPS: IdeaGroup[] = ["Problems", "Opportunities", "Features", "User needs", "Visual ideas", "Open questions"];
export interface Idea { id: string; group: IdeaGroup; text: string; status: "open" | "selected" | "rejected" | "research"; origin: "you" | "analysis" | "ai" | "local"; createdAt: number }
export interface DesignTask { id: string; text: string; done: boolean; fromIdea?: string }
export interface Requirement { id: string; text: string; fromIdea?: string }
export interface Brainstorm { ideas: Idea[]; tasks: DesignTask[]; requirements: Requirement[] }

export interface Project {
  id: string;
  name: string;
  brief: string;
  settings: ProjectSettings;
  profile: ProjectProfile;
  directions: Direction[];
  selectedDirection: string | null;
  source: Source;            // who produced the analysis
  status: "draft" | "exploring" | "ready" | "handed-off";
  favorite: boolean;
  bookmarks: Bookmark[];
  savedPalettes: Palette[];
  savedFonts: (FontChoice & { id: string })[];
  moodboards: Moodboard[];
  share?: Share;
  altPalettes?: Palette[];
  brainstorm?: Brainstorm;
  starter?: { done: string[]; extraScreens: string[] };
  library?: { favorites: string[]; recent: string[] };
  activity: { at: number; text: string }[];
  createdAt: number;
  updatedAt: number;
}
