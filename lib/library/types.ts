import type { PaletteColors } from "../types";
import type { Semantic } from "../engine/palette";
import type { UiStyle } from "../engine/uistyle";
import type { TypeStep } from "../engine/starterkit";
import type { Vec } from "../vector/ir";

export type Category = "foundations" | "actions" | "navigation" | "content" | "feedback" | "product";
export const CATEGORY_LABEL: Record<Category, string> = { foundations: "Foundations", actions: "Actions & controls", navigation: "Navigation", content: "Content & data", feedback: "Feedback & overlays", product: "Product patterns" };

/** Everything a component needs from the project: real colors, fonts and derived tokens. */
export interface Ctx {
  brand: string; heading: string; body: string; colors: PaletteColors; sem: Semantic; ui: UiStyle;
  scale: TypeStep[]; spacing: number[]; dark: boolean; radius: number;
  /** Selected brand logo as inline SVG with outlined lettering (trimmed to the artwork), when the project has one. */
  logo?: string;
}
export interface Cfg { variant: string; size: string; iconPos: "none" | "left" | "right" }
export interface Control { key: "variant" | "size" | "iconPos"; label: string; options: { value: string; label: string }[]; default: string }
export interface StateDemo { label: string; html: string; note?: string }
export type Measure = (text: string, size: number, weight?: number, family?: "heading" | "body") => number;

export interface Component {
  id: string; category: Category; name: string; desc: string;
  use: string[]; avoid: string[]; a11y: string[]; spacing: string[]; notes: string[];
  /** CSS custom properties this component reads (shown in the tokens table). */
  tokens: string[];
  controls: Control[];
  html: (cfg: Cfg, ctx: Ctx) => string;
  /** CSS block ids from css.ts (the base block is always included). */
  css: string[];
  states?: (ctx: Ctx) => StateDemo[];
  /** Vector artwork for SVG export; absent when the component can't be represented faithfully as SVG. */
  vector?: (cfg: Cfg, ctx: Ctx, m: Measure) => Vec;
  vectorNote?: string;
  interactive?: boolean;
  /** Preferred preview width: tight components don't need a wide stage. */
  stageMin?: number;
}

export const SIZES: Control = { key: "size", label: "Size", default: "md", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }] };
export const ICONPOS: Control = { key: "iconPos", label: "Icon", default: "none", options: [{ value: "none", label: "None" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }] };
export const variantControl = (opts: [string, string][], def = opts[0][0]): Control => ({ key: "variant", label: "Variant", default: def, options: opts.map(([value, label]) => ({ value, label })) });
