import { directionOf, designBrief, fullCss, accessibilityNotes } from "./handoff";
import { exportDtcg, darkTheme, semanticColors } from "./palette";
import { fontFamilyCss, fallbackStack, googleFontsUrl } from "../fonts";
import { ACCESSIBILITY, checklist, gridGuidance, starterSet, STATES, typeScale } from "./starterkit";
import { uiStyleOf } from "./uistyle";
import { referenceSearchLinks, competitorSearchLinks } from "./resources";
import { INDUSTRIES } from "./taxonomy";
import { BASE_CSS, GROUPS } from "./componentCss";
import { readableOn } from "../color";
import { ROLES, type Direction, type Moodboard, type Project } from "../types";
import { searchKeywords } from "../searchKeywords";

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "project";
export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const L = (a: string[]) => a.map((x) => `- ${x}`).join("\n");

export function analysisMarkdown(p: Project): string {
  const pr = p.profile;
  const d = directionOf(p);
  return `# ${p.name} — project brief & analysis

Source: ${p.source === "ai" ? "AI analysis (Google Gemini)" : "built-in rule-based analysis (not AI)"} · Exported ${new Date().toISOString().slice(0, 10)}

## Brief
${p.brief}

## Summary
${pr.summary}

| | |
|---|---|
| Project type | ${pr.projectType} |
| Industry / niche | ${pr.industry} — ${pr.niche} |
| Audience | ${pr.audience} |
| Platforms | ${pr.platforms.join("; ")} |
| Design style | ${pr.designStyle} |

## User needs
${L(pr.userNeeds)}

## Business goals
${L(pr.businessGoals)}

## Design challenges
${L(pr.challenges)}

## Brand personality & visual mood
${pr.brandPersonality.join(", ")} / ${pr.visualMood.join(", ")}

## Typography, color and imagery direction
- Typography: ${pr.typography}
- Color: ${pr.colorDirection}
- Imagery: ${pr.imageDirection}

## Creative directions
${p.directions.map((x) => `### ${x.name}${x.id === d?.id && p.selectedDirection ? " (selected)" : ""}\n${x.summary}\n- Fonts: ${x.fonts.heading} + ${x.fonts.body}\n- Palette: ${ROLES.map((r) => `${r} ${x.palette.colors[r]}`).join(", ")}\n- Principles: ${x.principles.join("; ")}`).join("\n\n")}
`;
}

export function researchMarkdown(p: Project): string {
  const d = directionOf(p);
  const kw = searchKeywords(p, d).slice(0, 5).join(" ");
  const industry = INDUSTRIES.find((i) => i.label === p.profile.industry);
  const saved = p.bookmarks.filter((b) => b.url);
  return `# ${p.name} — research links

Selected direction: ${p.selectedDirection && d ? d.name : "none selected yet"}

## Your saved references
${saved.length ? saved.map((b) => `- [${b.title}](${b.url})${b.source ? ` — ${b.source}` : ""}`).join("\n") : "_Nothing bookmarked yet._"}

## Search links (opens each source's own results; not verified by DesignPilot)
${referenceSearchLinks(kw).map((l) => `- [${l.name}](${l.url}) — ${l.note}`).join("\n")}

## Competitor research searches
${competitorSearchLinks(industry?.searchTerms ?? [kw]).map((l) => `- [${l.name}](${l.url})`).join("\n")}

## Brands to research${d ? ` (${d.name})` : ""}
${d ? L(d.brandReferences) : "_Select a direction._"}
`;
}

export function typographySpec(d: Direction) {
  const scale = typeScale(d);
  return {
    heading: { family: d.fonts.heading, css: fontFamilyCss(d.fonts.heading), fallback: fallbackStack(d.fonts.heading) },
    body: { family: d.fonts.body, css: fontFamilyCss(d.fonts.body), fallback: fallbackStack(d.fonts.body) },
    googleFontsUrl: googleFontsUrl([d.fonts.heading, d.fonts.body]),
    scale: { ratio: scale.ratio, base: scale.base, steps: scale.steps.map((s) => ({ name: s.name, sizePx: s.size, lineHeight: s.line, use: s.use })) },
    rationale: d.fontRationale,
  };
}

export function consolidatedTokens(p: Project): string {
  const d = directionOf(p)!;
  const ui = uiStyleOf(d);
  const grid = gridGuidance(d);
  const sem = semanticColors(d.palette.colors.background);
  const semDark = semanticColors(darkTheme(d.palette.colors).background);
  return JSON.stringify({
    $description: `${p.name} — design tokens (${d.name})`,
    ...JSON.parse(exportDtcg(d.palette.colors)),
    semantic: { light: Object.fromEntries(Object.entries(sem).map(([k, v]) => [k, { $type: "color", $value: v }])), dark: Object.fromEntries(Object.entries(semDark).map(([k, v]) => [k, { $type: "color", $value: v }])) },
    typography: typographySpec(d),
    space: Object.fromEntries(grid.spacing.map((n) => [String(n), { $type: "dimension", $value: `${n}px` }])),
    radius: { base: { $type: "dimension", $value: `${ui.radius}px` }, sm: { $type: "dimension", $value: `${Math.max(0, Math.round(ui.radius / 2))}px` }, lg: { $type: "dimension", $value: `${Math.round(ui.radius * 1.6)}px` } },
    gradients: Object.fromEntries(d.palette.gradients.map((g) => [slug(g.name), { $value: g.css }])),
  }, null, 2);
}

export function cssVariables(p: Project): string {
  const d = directionOf(p)!;
  const ui = uiStyleOf(d);
  const sem = semanticColors(d.palette.colors.background);
  return `${fullCss(d)}\n\n/* Semantic + component tokens (light theme) */\n:root {\n${Object.entries(sem).map(([k, v]) => `  --color-${k}: ${v};`).join("\n")}\n  --color-on-primary: ${readableOn(d.palette.colors.primary)};\n  --color-on-danger: ${readableOn(sem.danger)};\n  --radius-base: ${ui.radius}px;\n  --border-w: ${ui.border.split(" ")[0]};\n  --shadow: ${ui.shadow === "none" ? "none" : `${ui.shadow} ${d.palette.colors.text}33`};\n}\n`;
}

export function componentsCssFile(p: Project): string {
  return `${cssVariables(p)}\n/* ===== Component styles (framework-agnostic CSS; markup examples are in the Components tab) ===== */\n${BASE_CSS.trim()}\n${GROUPS.map((g) => (g.css.startsWith("/*") ? "" : `\n/* ${g.title} */\n${g.css}`)).join("\n")}\n`;
}

export function componentSpecs(p: Project): string {
  const d = directionOf(p)!;
  const ui = uiStyleOf(d);
  const c = d.palette.colors;
  return `# ${p.name} — component specifications (${d.name})

Derived from the selected direction's palette, typography and UI characteristics. Starting points to refine, not a finished design system.

## Global style
- Corner radius: ${ui.radius}px · Border: ${ui.border} ${c.border} · Shadow: ${ui.shadow === "none" ? "none" : `${ui.shadow} (use ${c.text} at low opacity)`}
- Density: ${ui.density} · Motion: ${ui.motion}
- Fonts: ${d.fonts.heading} (headings), ${d.fonts.body} (body)

## Priority components
${d.components.map((x) => `### ${x}\n- Use tokens only (no hard-coded colors).\n- States: default, hover, focus-visible, active, disabled, loading, error where relevant.\n- Touch target at least 44px on mobile.`).join("\n\n")}

## Buttons
- Primary: background ${c.primary}, label ${c.background}. ${ui.buttons}.
- Secondary: surface ${c.surface} with ${c.border} border. Focus ring: 2px ${c.primary}, 2px offset.

## Required states for every screen
${L(STATES)}
`;
}

export function responsiveNotes(p: Project): string {
  const d = directionOf(p)!;
  const g = gridGuidance(d);
  const set = starterSet(p);
  return `# ${p.name} — screens & responsive behavior

Screen suggestions below are DesignPilot's recommendations for a "${set.label}" project; they are not part of your brief analysis.

## Screens
${set.screens.map((s) => `- **${s.name}** (priority ${s.priority}): ${s.purpose}`).join("\n")}

## Journeys
${L(set.journeys)}

## Grid & spacing
- Base unit ${g.unit}px; scale: ${g.spacing.join(", ")}px
${g.breakpoints.map(([n, r, x]) => `- ${n} (${r}): ${x}`).join("\n")}

## Responsive rules
- Design mobile first; stack to a single column below 640px.
- Navigation: drawer or bottom bar on mobile; sidebar or top bar on desktop.
- Tables: horizontal scroll inside a bordered container or convert to cards.
- Never rely on hover for essential actions.
`;
}

export function accessibilityMarkdown(p: Project): string {
  const d = directionOf(p)!;
  return `# ${p.name} — accessibility guidance\n\n## From the selected palette\n${L(accessibilityNotes(d))}\n\n## General reminders\n${L(ACCESSIBILITY)}\n`;
}

export function checklistMarkdown(p: Project): string {
  const d = directionOf(p)!;
  const done = new Set(p.starter?.done ?? []);
  const items = checklist(p, d);
  const groups = [...new Set(items.map((i) => i.group))];
  const req = p.brainstorm?.requirements ?? [], tasks = p.brainstorm?.tasks ?? [];
  const screens = starterSet(p).screens;
  const extra = p.starter?.extraScreens ?? [];
  const screenSection = `## Screens\n${screens.map((x) => `- [${done.has(`screen:${x.id}`) ? "x" : " "}] ${x.name}${x.priority === 1 ? " (priority)" : ""}`).join("\n")}${extra.length ? "\n" + extra.map((t) => `- [ ] ${t} (added by you)`).join("\n") : ""}`;
  return `# ${p.name} — design implementation checklist\n\n${screenSection}\n\n${groups.map((g) => `## ${g}\n${items.filter((i) => i.group === g).map((i) => `- [${done.has(i.id) ? "x" : " "}] ${i.text}`).join("\n")}`).join("\n\n")}${tasks.length ? `\n\n## Design tasks (from brainstorming)\n${tasks.map((t) => `- [${t.done ? "x" : " "}] ${t.text}`).join("\n")}` : ""}${req.length ? `\n\n## Design requirements (from brainstorming)\n${L(req.map((r) => r.text))}` : ""}\n`;
}

const PRINT_CSS = `body{font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#17171c;max-width:820px;margin:0 auto;padding:32px 20px}h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}h3{font-size:15px;margin:16px 0 4px}.meta{color:#666;font-size:13px}ul{padding-left:20px}.sw{display:inline-block;width:44px;height:44px;border-radius:6px;border:1px solid #0002;margin:0 6px 6px 0;vertical-align:top}.sws span{display:inline-block;font:11px/1.2 ui-monospace,monospace;width:50px;text-align:center}.card{border:1px solid #ddd;border-radius:8px;padding:12px 14px;margin:10px 0;break-inside:avoid}.bar{position:sticky;top:0;background:#fff;padding:8px 0;margin-bottom:8px}button{font:inherit;padding:6px 12px}@media print{.bar{display:none}body{padding:0}}`;
const li = (a: string[]) => `<ul>${a.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
const swatches = (d: Direction) => `<div class="sws">${ROLES.map((r) => `<span><i class="sw" style="background:${escapeHtml(d.palette.colors[r])}"></i><br>${r}<br>${escapeHtml(d.palette.colors[r])}</span>`).join("")}</div>`;

/** Printable summary. The browser's "Save as PDF" in the print dialog produces the PDF — no server or paid service involved. */
export function printableSummaryHtml(p: Project): string {
  const d = directionOf(p)!;
  const pr = p.profile;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(p.name)} — design summary</title><style>${PRINT_CSS}</style></head><body>
<div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
<h1>${escapeHtml(p.name)}</h1><p class="meta">Design summary · ${p.source === "ai" ? "AI analysis" : "rule-based analysis (not AI)"} · ${new Date().toISOString().slice(0, 10)}</p>
<p>${escapeHtml(pr.summary)}</p>
<h2>Brief</h2><p>${escapeHtml(p.brief)}</p>
<h2>Audience &amp; goals</h2><p><b>Audience:</b> ${escapeHtml(pr.audience)}</p><h3>User needs</h3>${li(pr.userNeeds)}<h3>Business goals</h3>${li(pr.businessGoals)}<h3>Challenges</h3>${li(pr.challenges)}
<h2>Selected direction: ${escapeHtml(d.name)}${p.selectedDirection ? "" : " (suggested — none selected yet)"}</h2><p>${escapeHtml(d.summary)}</p>${swatches(d)}
<p><b>Typography:</b> ${escapeHtml(d.fonts.heading)} + ${escapeHtml(d.fonts.body)}<br><span class="meta">${escapeHtml(d.fontRationale)}</span></p>
<h3>Principles</h3>${li(d.principles)}<h3>Imagery</h3><p>${escapeHtml(d.imageStyle)}</p><h3>Key components</h3>${li(d.components)}
<h2>All directions</h2>${p.directions.map((x) => `<div class="card"><b>${escapeHtml(x.name)}</b> — ${escapeHtml(x.fonts.heading)} + ${escapeHtml(x.fonts.body)}${swatches(x)}</div>`).join("")}
<p class="meta">Suggestions are generated and not verified research. Confirm font, icon and image licences at their sources.</p>
</body></html>`;
}

export function moodboardHtml(p: Project, b: Moodboard): string {
  const items = b.items.map((i) => {
    switch (i.type) {
      case "swatch": return `<div class="card" style="background:${escapeHtml(i.hex)}"><b>${escapeHtml(i.label)}</b><br>${escapeHtml(i.hex)}</div>`;
      case "type": return `<div class="card"><div style="font-size:26px;font-family:'${escapeHtml(i.heading)}',serif">${escapeHtml(i.sample)}</div><span class="meta">${escapeHtml(i.heading)} + ${escapeHtml(i.body)}</span></div>`;
      case "note": return `<div class="card">${escapeHtml(i.text).replace(/\n/g, "<br>")}</div>`;
      case "tag": return `<div class="card"><span class="meta">${escapeHtml(i.group)}</span><br>${escapeHtml(i.text)}</div>`;
      case "link": { let ok = false; try { ok = /^https?:$/.test(new URL(i.url).protocol); } catch { /* invalid */ } return `<div class="card"><span class="meta">Reference · ${escapeHtml(i.source)}</span><br>${ok ? `<a href="${escapeHtml(i.url)}">${escapeHtml(i.title)}</a>` : escapeHtml(i.title)}</div>`; }
    }
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(b.name)} — moodboard</title><style>${PRINT_CSS}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.grid .card{margin:0}</style></head><body><div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div><h1>${escapeHtml(b.name)}</h1><p class="meta">Moodboard for ${escapeHtml(p.name)}</p><div class="grid">${items}</div></body></html>`;
}

export interface ExportItem { id: string; group: "Documentation" | "Design tokens" | "Developer handoff" | "Moodboard"; title: string; desc: string; filename: string; mime: string; build: (p: Project) => string; open?: boolean }

export const EXPORTS: ExportItem[] = [
  { id: "analysis", group: "Documentation", title: "Brief & analysis", desc: "Your brief, the full analysis and every creative direction.", filename: "brief-and-analysis.md", mime: "text/markdown", build: analysisMarkdown },
  { id: "brief", group: "Documentation", title: "Developer-ready design brief", desc: "Structured brief for the selected direction.", filename: "design-brief.md", mime: "text/markdown", build: designBrief },
  { id: "research", group: "Documentation", title: "Research links & direction", desc: "Saved references, search links and brands to research.", filename: "research-links.md", mime: "text/markdown", build: researchMarkdown },
  { id: "summary", group: "Documentation", title: "Printable summary (PDF via print)", desc: "Opens a print-ready page. Use your browser's Print → Save as PDF.", filename: "design-summary.html", mime: "text/html", build: printableSummaryHtml, open: true },
  { id: "palette", group: "Design tokens", title: "Palette (JSON)", desc: "Light and dark palettes, W3C design-token format.", filename: "palette.tokens.json", mime: "application/json", build: (p) => exportDtcg(directionOf(p)!.palette.colors) },
  { id: "css", group: "Design tokens", title: "CSS custom properties", desc: "Fonts, colors, semantic colors, radius and spacing.", filename: "design-tokens.css", mime: "text/css", build: cssVariables },
  { id: "type", group: "Design tokens", title: "Typography specification", desc: "Families, fallbacks, Google Fonts URL and type scale.", filename: "typography.json", mime: "application/json", build: (p) => JSON.stringify(typographySpec(directionOf(p)!), null, 2) },
  { id: "tokens", group: "Design tokens", title: "Consolidated token file", desc: "Colors, semantic colors, typography, spacing, radius, gradients.", filename: "design-tokens.json", mime: "application/json", build: consolidatedTokens },
  { id: "componentcss", group: "Developer handoff", title: "Component CSS (HTML + CSS)", desc: "Tokens plus the exact CSS used by the live component previews.", filename: "components.css", mime: "text/css", build: componentsCssFile },
  { id: "components", group: "Developer handoff", title: "Component specifications", desc: "Style rules and required states for priority components.", filename: "component-specs.md", mime: "text/markdown", build: componentSpecs },
  { id: "responsive", group: "Developer handoff", title: "Screens & responsive notes", desc: "Suggested screens, journeys, grid and breakpoints.", filename: "screens-and-responsive.md", mime: "text/markdown", build: responsiveNotes },
  { id: "a11y", group: "Developer handoff", title: "Accessibility guidance", desc: "Palette contrast results and reminders.", filename: "accessibility.md", mime: "text/markdown", build: accessibilityMarkdown },
  { id: "checklist", group: "Developer handoff", title: "Implementation checklist", desc: "Prioritized checklist with your progress, tasks and requirements.", filename: "implementation-checklist.md", mime: "text/markdown", build: checklistMarkdown },
];
