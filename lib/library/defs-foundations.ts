import { esc, icon } from "./h";
import { ICON_NAMES } from "./icons";
import { sheet, swatchShapes, mix } from "./vec";
import { iconShapes } from "./icons";
import { line, rect, text, type Shape } from "../vector/ir";
import { ROLES } from "../types";
import { type Component, type Ctx } from "./types";

const hex = (c: string) => c.toUpperCase();
const SHADOWS = [["none", "none"], ["sm", "0 1px 2px rgba(0,0,0,.18)"], ["md", "0 6px 16px -4px rgba(0,0,0,.28)"], ["lg", "0 18px 40px -10px rgba(0,0,0,.4)"]];

export const FOUNDATIONS: Component[] = [
  { id: "color-tokens", category: "foundations", name: "Color tokens", desc: "The project's palette as named tokens, plus the semantic colors used for status.",
    use: ["Use tokens by role (primary, surface, text), never raw hex values in components.", "Pair every foreground token with a background token that reaches 4.5:1 contrast.", "Reserve semantic colors for status (success, warning, danger, info)."],
    avoid: ["Using the accent color for body text.", "Introducing one-off colors that aren't tokens.", "Communicating status by color alone."],
    a11y: ["Body text needs 4.5:1 against its background; large text and UI borders need 3:1.", "Semantic colors shown here are tuned to 4.5:1 on the current background.", "Add an icon or label next to a status color."],
    spacing: ["Group tokens by role, not by hue.", "Keep surface, background and border within a narrow lightness range."],
    notes: ["Tokens are exported as CSS variables and W3C-format JSON.", "Dark values are derived from the light palette."],
    tokens: ["--color-primary", "--color-secondary", "--color-accent", "--color-background", "--color-surface", "--color-text", "--color-border", "--color-success", "--color-warning", "--color-danger", "--color-info"], controls: [],
    css: ["foundation"],
    html: (_c, x) => `<div class="ds-stack"><div class="ds-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">${ROLES.map((r) => `<div class="ds-swatch"><i style="background:${x.colors[r]}"></i><div><b>${r}</b><code>${hex(x.colors[r])}</code></div></div>`).join("")}</div><p class="ds-label">Semantic</p><div class="ds-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">${(Object.entries(x.sem) as [string, string][]).map(([k, v]) => `<div class="ds-swatch"><i style="background:${v}"></i><div><b>${k}</b><code>${hex(v)}</code></div></div>`).join("")}</div></div>`,
    vector: (_c, x) => { const items: [string, string][] = [...ROLES.map((r): [string, string] => [r, x.colors[r]]), ...(Object.entries(x.sem) as [string, string][])]; const cols = 4, cw = 150, ch = 110, g = 14, rows = Math.ceil(items.length / cols); const shapes: Shape[] = items.flatMap(([k, v], i) => swatchShapes(g + (i % cols) * (cw + g), g + Math.floor(i / cols) * (ch + g), cw, ch, v, x, k, v)); return sheet(g + cols * (cw + g), g + rows * (ch + g), x, shapes, `${x.brand} — color tokens`); } },

  { id: "typography", category: "foundations", name: "Typography scale", desc: "Heading and body typefaces with a modular type scale and recommended pairings.",
    use: ["Set headings in the heading face and everything else in the body face.", "Use the scale steps; don't invent sizes.", "Keep line length between 45 and 75 characters."],
    avoid: ["More than two typefaces.", "Heading text smaller than body text.", "Long paragraphs in the display step."],
    a11y: ["Body text at least 16px on mobile.", "Line-height 1.5 or more for paragraphs.", "Don't rely on weight alone to convey emphasis for essential information."],
    spacing: ["Space headings 1.5× closer to the text below than the text above.", "Use the spacing scale for vertical rhythm."],
    notes: ["Fonts load from Google Fonts. Provide fallback stacks (see Typography tab).", "Scale ratio follows the direction's density."],
    tokens: ["--font-heading", "--font-body", "--color-text", "--color-muted"], controls: [], css: ["foundation"],
    html: (_c, x) => `<div class="ds-stack">${x.scale.map((s) => `<div class="ds-specimen"><small>${esc(s.name)} · ${s.size}px / ${s.line} · ${s.name === "Body" || s.name === "Small" ? esc(x.body) : esc(x.heading)}</small><span style="font-family:var(--font-${s.name === "Body" || s.name === "Small" ? "body" : "heading"});font-size:${Math.min(s.size, 56)}px;line-height:${s.line};font-weight:${s.name === "Body" || s.name === "Small" ? 400 : 700}">${s.name === "Body" ? "Good design is invisible: it guides the reader without asking for attention." : s.name === "Small" ? "Captions, labels and metadata sit here." : "Considered design"}</span></div>`).join("")}</div>`,
    vector: (_c, x) => { let y = 20; const shapes: Shape[] = []; for (const s of x.scale) { const body = s.name === "Body" || s.name === "Small", fs = Math.min(s.size, 48); shapes.push(text(20, y + 10, `${s.name} · ${s.size}px / ${s.line} · ${body ? x.body : x.heading}`, 11, x.body, mix(x.colors.text, x.colors.background, 0.45))); y += 14 + fs; shapes.push(text(20, y, s.name === "Body" ? "Good design is invisible." : s.name === "Small" ? "Captions and metadata" : "Considered design", fs, body ? x.body : x.heading, x.colors.text, { weight: body ? 400 : 700 })); y += 16; shapes.push(line(20, y, 640, y, { stroke: x.colors.border, sw: 1 })); y += 12; } return sheet(660, y + 8, x, shapes, `${x.brand} — typography scale`); } },

  { id: "spacing", category: "foundations", name: "Spacing & layout grid", desc: "The spacing scale and grid used to place everything.",
    use: ["Pick spacing from the scale only.", "Use larger steps between groups than within them.", "Align elements to the grid columns."],
    avoid: ["Arbitrary pixel values.", "Equal spacing everywhere (it removes hierarchy).", "Edge-to-edge text on mobile."],
    a11y: ["Keep 44px touch targets with at least 8px between them.", "Generous spacing improves scanning for low-vision users."],
    spacing: ["Mobile: 16px margins, 4 columns. Tablet: 32px margins, 8 columns. Desktop: max 1200px, 12 columns."],
    notes: ["The spacing multiplier in the customize panel scales component padding (density)."],
    tokens: ["--sp"], controls: [], css: ["foundation"],
    html: (_c, x) => `<div class="ds-stack"><p class="ds-label">Spacing scale</p>${x.spacing.map((n, i) => `<div class="ds-space"><code>space-${i + 1}</code><i style="width:${n * 3}px"></i><span>${n}px</span></div>`).join("")}<p class="ds-label">Layout grid</p><div class="ds-row" style="gap:6px;align-items:stretch">${Array.from({ length: 12 }, () => `<i style="flex:1;min-width:14px;height:48px;border-radius:4px;background:color-mix(in srgb,var(--color-primary) 18%,transparent);border:1px solid color-mix(in srgb,var(--color-primary) 45%,transparent)"></i>`).join("")}</div><p class="ds-help">12 columns · 24px gutters · 1200px max width (4 columns on mobile)</p></div>`,
    vector: (_c, x) => { const shapes: Shape[] = [text(20, 28, "Spacing scale", 12, x.body, mix(x.colors.text, x.colors.background, 0.45), { weight: 700 })]; x.spacing.forEach((n, i) => { const y = 44 + i * 30; shapes.push(text(20, y + 14, `space-${i + 1}`, 11, x.body, mix(x.colors.text, x.colors.background, 0.45)), rect(100, y, n * 3, 18, { fill: x.colors.primary }, 3), text(110 + n * 3, y + 14, `${n}px`, 11, x.body, x.colors.text)); }); const gy = 44 + x.spacing.length * 30 + 20; shapes.push(text(20, gy, "Layout grid · 12 columns · 24px gutters", 12, x.body, mix(x.colors.text, x.colors.background, 0.45), { weight: 700 })); for (let i = 0; i < 12; i++) shapes.push(rect(20 + i * 50, gy + 14, 38, 56, { fill: mix(x.colors.background, x.colors.primary, 0.18), stroke: mix(x.colors.background, x.colors.primary, 0.5), sw: 1 }, 4)); return sheet(640, gy + 90, x, shapes, `${x.brand} — spacing`); } },

  { id: "radius-elevation", category: "foundations", name: "Radius, borders & elevation", desc: "Corner radii, border widths and shadow levels for layering surfaces.",
    use: ["Use one base radius and derive smaller/larger steps from it.", "Use elevation to show layering (menus above cards above page).", "Prefer borders over shadows on dark backgrounds."],
    avoid: ["Mixing sharp and very round corners in one view.", "Heavy shadows on every card.", "Using shadow as the only separator."],
    a11y: ["Don't use low-contrast borders as the only boundary of an input (3:1 required).", "Shadows are decorative: don't encode meaning in them."],
    spacing: ["Nested rounded elements should use a smaller radius than their container."],
    notes: ["SVG export is not offered because CSS shadows can't be reproduced exactly in SVG."],
    tokens: ["--radius-base", "--border-w", "--shadow", "--color-border"], controls: [], css: ["foundation"],
    vectorNote: "This sheet contains CSS box-shadows, which SVG can't reproduce accurately. Use PNG, JPEG or PDF.",
    html: (_c, x) => `<div class="ds-stack"><p class="ds-label">Radius</p><div class="ds-row">${[["sm", Math.round(x.radius * 0.6)], ["base", x.radius], ["lg", Math.round(x.radius * 1.5)], ["pill", 999]].map(([k, v]) => `<div style="width:92px;height:64px;background:var(--color-surface);border:var(--border-w) solid var(--color-primary);border-radius:${v}px;display:grid;place-items:center;font-size:12px">${k}<br><span class="ds-muted">${v === 999 ? "999" : v}px</span></div>`).join("")}</div><p class="ds-label">Border width</p><div class="ds-row">${[1, 2, 3].map((w) => `<div style="width:92px;height:48px;border:${w}px solid var(--color-text);border-radius:var(--radius-base);display:grid;place-items:center;font-size:12px">${w}px</div>`).join("")}</div><p class="ds-label">Elevation</p><div class="ds-elev" style="border-radius:var(--radius-base)">${SHADOWS.map(([k, v]) => `<div style="border-radius:var(--radius-base);box-shadow:${v}">${k}</div>`).join("")}</div></div>` },

  { id: "icons", category: "foundations", name: "Icon style & sizing", desc: "A consistent line-icon set with sizes and usage rules.",
    use: ["Use one icon style (2px round line) across the product.", "Pair icons with labels unless the meaning is universal.", "Size icons to the text: 16px with small text, 20px with body, 24px for navigation."],
    avoid: ["Mixing filled and outline icons in the same toolbar.", "Icon-only buttons without an accessible name.", "Decorative icons that add noise."],
    a11y: ["Icon-only controls need aria-label or visible text.", "Decorative icons use aria-hidden=\"true\".", "Minimum 44×44px touch area around small icons."],
    spacing: ["Gap between icon and label: 8px.", "Icons align to the text baseline."],
    notes: ["Icons are drawn on a 24px grid with 2px round strokes.", "The same geometry exports to SVG."],
    tokens: ["--color-text", "--color-muted"], controls: [], css: ["foundation"],
    html: () => `<div class="ds-stack"><div class="ds-icons">${ICON_NAMES.map((n) => `<div>${icon(n, 24)}<span>${n}</span></div>`).join("")}</div><p class="ds-label">Sizes</p><div class="ds-row" style="gap:24px;align-items:end">${[16, 20, 24, 32].map((s) => `<span style="display:grid;justify-items:center;gap:6px;font-size:11px" class="ds-muted">${icon("star", s)}${s}px</span>`).join("")}</div></div>`,
    vector: (_c, x) => { const cols = 8, cell = 88, shapes: Shape[] = []; ICON_NAMES.forEach((n, i) => { const cx = 14 + (i % cols) * (cell + 8), cy = 14 + Math.floor(i / cols) * (cell + 8); shapes.push(rect(cx + 0.5, cy + 0.5, cell - 1, cell - 1, { fill: x.colors.surface, stroke: x.colors.border, sw: 1 }, x.radius), ...iconShapes(n, cx + cell / 2 - 12, cy + 18, 24, x.colors.text), text(cx + cell / 2, cy + cell - 14, n, 10, x.body, mix(x.colors.text, x.colors.surface, 0.45), { anchor: "middle" })); }); const rows = Math.ceil(ICON_NAMES.length / cols); return sheet(14 + cols * (cell + 8), 14 + rows * (cell + 8), x, shapes, `${x.brand} — icon set`); } },

  { id: "breakpoints", category: "foundations", name: "Responsive breakpoints", desc: "How layouts adapt at mobile, tablet and desktop widths.",
    use: ["Design mobile first, then add complexity at wider widths.", "Use container queries for components and breakpoints for page layout.", "Test at 320, 375, 768, 1024 and 1440px."],
    avoid: ["Hiding essential actions on mobile.", "Horizontal page scroll at any width.", "Fixed pixel widths on containers."],
    a11y: ["Support 200% zoom without losing content.", "Don't lock orientation."],
    spacing: ["Mobile margins 16px, tablet 32px, desktop centered at 1200px."],
    notes: ["Each library component also adapts to the width of its container (use the width toggle above the preview)."],
    tokens: ["--sp"], controls: [], css: ["foundation"],
    html: () => `<div class="ds-bp">${[["Mobile", "320–639", 18], ["Tablet", "640–1023", 42], ["Desktop", "1024–1439", 70], ["Wide", "1440+", 100]].map(([n, r, w]) => `<div><span><b>${n}</b><br><span class="ds-muted">${r}px</span></span><i style="width:${w}%"></i></div>`).join("")}</div>` },
];
