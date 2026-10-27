// Plain-text brand kit documents. Everything is derived from the user's own brand profile, the chosen concept
// and the selected direction; nothing is a claim about market position, uniqueness or legal protection.
import type { Direction } from "../types";
import { ROLES } from "../types";
import { describe, type Analysis } from "./concepts";
import { ARCH, minSizes, renderLogo, type Fonts } from "./render";
import type { BrandProfile, ConceptSpec } from "./types";

export const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "brand";
const bullets = (a: string[]) => a.filter(Boolean).map((x) => `- ${x}`).join("\n") || "_Not set yet._";
const up = (h: string) => h.toUpperCase();

export function brandColors(spec: ConceptSpec, d: Direction) {
  const l = spec.palette;
  return {
    logo: [{ name: "Logo ink", hex: l.ink }, { name: "Logo accent", hex: l.accent }, { name: "Logo background", hex: l.bg }, { name: "Logo deep (reversed background)", hex: l.deep }],
    direction: ROLES.map((r) => ({ name: r, hex: d.palette.colors[r] })),
  };
}

export const colorsMd = (spec: ConceptSpec, d: Direction) => {
  const c = brandColors(spec, d);
  return `# ${spec.name} — colour\n\n## Logo colours\n${c.logo.map((x) => `- ${x.name}: ${up(x.hex)}`).join("\n")}\n\n## Interface palette (${d.name})\n${c.direction.map((x) => `- ${x.name}: ${up(x.hex)}`).join("\n")}\n\nUse the logo colours only for the logo. Check text contrast in the Colors tab before using any pair for text.\n`;
};

export const tokensCss = (spec: ConceptSpec | null, d: Direction) => {
  const c = spec ? brandColors(spec, d) : null, dir = ROLES.map((r) => ({ name: r, hex: d.palette.colors[r] }));
  return `${spec ? "" : "/* No logo selected yet: these are the interface tokens only. Choose “Use as my logo” in Logo & brand to add logo colours and lettering. */\n"}:root {\n${c ? c.logo.map((x) => `  --brand-${slugOf(x.name.replace(/ \(.*\)/, ""))}: ${x.hex};`).join("\n") + "\n" : ""}${dir.map((x) => `  --color-${x.name}: ${x.hex};`).join("\n")}\n${spec ? `  --font-logo: "${spec.font.family}", sans-serif;\n` : ""}  --font-heading: "${d.fonts.heading}", serif;\n  --font-body: "${d.fonts.body}", sans-serif;\n}\n`;
};

export const typographyMd = (spec: ConceptSpec, d: Direction) =>
  `# ${spec.name} — typography\n\n- Logo lettering: ${spec.font.family} ${spec.font.weight}${spec.caps ? " (capitals)" : ""}. Exported logo files contain outlines, so the font is not needed to display them.\n- Headings: ${d.fonts.heading}\n- Body: ${d.fonts.body}\n\n${d.fontRationale}\n\nBoth families are open-source Google Fonts. Check each licence before embedding fonts in a product.\n`;

export const personalityMd = (p: BrandProfile) =>
  `# ${p.name} — brand personality\n\n**Industry:** ${p.industry || "—"}\n**Audience:** ${p.audience || "—"}\n\n## Personality\n${bullets(p.personality)}\n\n## Values\n${bullets(p.values)}\n\n## Emotions to evoke\n${bullets(p.emotions)}\n\n## Tone of voice\n${p.tone || "_Not set yet._"}\n\n## Positioning\n${p.positioning || "_Not set yet._"}\n\n## What you say makes it different\n${p.differentiators || "_Not set yet. Add your own differentiators; DesignPilot does not invent them._"}\n\n## Constraints\n${p.constraints || "_None stated._"}\n\n## Competitor notes (yours)\n${p.competitors || "_None added._"}\n`;

export function guidelinesMd(spec: ConceptSpec, profile: BrandProfile, f: Fonts): string {
  const r = renderLogo(spec, "primary", "full", f), m = minSizes(r), a = describe(spec, profile);
  return `# ${spec.name} — logo usage\n\nConcept: ${ARCH[spec.archetype].label}.\n\n## Clear space\nKeep at least **x** free on every side, where x = ${Math.round(r.pad)} units of this artwork (a quarter of the symbol height). Nothing else (text, edges, images) enters that zone.\n\n## Minimum size (rule of thumb, derived from the artwork)\n- Digital: ${m.digitalW}px wide (${m.digitalH}px tall) for the primary lockup. Below that, use the symbol or compact version.\n- Print: about ${m.printMm}mm wide.\n\n## Colour versions\n- Full colour on light backgrounds.\n- Reversed (light logo on ${spec.palette.deep}) on dark backgrounds.\n- Black or white one-colour versions when colour is not available.\n\n## Do\n- Use the supplied files; do not redraw the logo.\n- Keep proportions and use the one-colour version on busy photos.\n- Check contrast between logo and background.\n\n## Don't\n- Stretch, rotate, recolour or add effects (shadows, outlines, gradients).\n- Place it on backgrounds with too little contrast.\n- Rebuild the lettering in another font.\n\n## Limits\n${a.weakness}\n\nThis guide is practical design guidance only. DesignPilot has not checked this logo against existing logos or trademarks. Do that before commercial use.\n`;
}

export const graphicStyleMd = (spec: ConceptSpec, d: Direction) => `# ${spec.name} — icon & graphic style\n\n- Icons: ${d.iconStyle}\n- Illustration: ${d.illustrationStyle}\n- Logo direction: ${d.logoDirection}\n\nKeep stroke weights, corner radii and colours consistent with the logo's shape language.\n`;
export const imageDirectionMd = (spec: ConceptSpec, d: Direction) => `# ${spec.name} — image direction\n\n${d.imageStyle}\n\nPrinciples:\n${bullets(d.principles)}\n`;

export function summaryMd(spec: ConceptSpec, p: BrandProfile): string {
  const a: Analysis = describe(spec, p);
  return `# ${spec.name} — logo concept: ${ARCH[spec.archetype].label}\n\n**Idea:** ${a.idea}\n\n**Meaning:** ${a.meaning}\n\n**Shape language:** ${a.shape}\n\n**Typography:** ${a.type}\n\n**Colour:** ${a.color}\n\n**Personality:** ${a.personality}\n\n**Best use:** ${a.bestUse}\n\n**Weaknesses:** ${a.weakness}\n`;
}
