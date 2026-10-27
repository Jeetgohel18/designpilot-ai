"use client";
import { useState } from "react";
import { Badge, Button, Card, Chip, CopyButton, Notice, SectionHead, download, useToast } from "../ui";
import { hexToHsl, hslString, normalizeHex, readableOn, rgbString, contrast, wcagRating, hslToHex } from "@/lib/color";
import { contrastChecks, darkTheme, exportCss, exportDtcg, exportJson, exportTailwind, gradientsFor, regeneratePalette, semanticColors, setColor } from "@/lib/engine/palette";
import { newId } from "@/lib/engine/palette";
import { fontFamilyCss } from "@/lib/fonts";
import { useGoogleFonts } from "../FontLoader";
import { updateProject } from "@/lib/store";
import { ROLES, type Direction, type Palette, type PaletteColors, type Role } from "@/lib/types";
import type { TabProps } from "./shared";

function LivePreview({ colors, d, dark }: { colors: PaletteColors; d: Direction; dark: boolean }) {
  const c = dark ? darkTheme(colors) : colors;
  const hf = fontFamilyCss(d.fonts.heading), bf = fontFamilyCss(d.fonts.body);
  const onPrimary = readableOn(c.primary);
  return (
    <div className="overflow-hidden rounded-xl border border-line-strong" style={{ background: c.background, color: c.text, fontFamily: bf }}>
      <div className="flex items-center justify-between border-b px-5 py-3 text-xs" style={{ borderColor: c.border, background: c.surface }}>
        <span className="text-sm font-semibold" style={{ fontFamily: hf }}>Maison</span>
        <span className="hidden gap-4 opacity-70 sm:flex"><span>Shop</span><span>Ritual</span><span>Journal</span></span>
        <span className="rounded-full px-3 py-1" style={{ background: c.primary, color: onPrimary }}>Cart (2)</span>
      </div>
      <div className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:p-8">
        <div>
          <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ background: c.secondary + (dark ? "33" : "55"), color: c.text }}>New · Barrier repair</span>
          <h3 className="mt-4 text-3xl leading-[1.1] sm:text-4xl" style={{ fontFamily: hf }}>Skin, simplified.</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-75">Three honest ingredients per formula. Gentle enough for daily use, effective enough to notice.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: c.primary, color: onPrimary }}>Shop the routine</span>
            <span className="rounded-md border px-4 py-2 text-sm" style={{ borderColor: c.border, background: c.surface }}>Take the quiz</span>
          </div>
        </div>
        <div className="rounded-lg p-5" style={{ background: gradientsFor(c)[0].css }}>
          <div className="rounded-md p-4 text-sm" style={{ background: c.surface, color: c.text, border: `1px solid ${c.border}` }}>
            <p className="font-medium" style={{ fontFamily: hf }}>Barrier Serum</p>
            <p className="mt-1 text-xs opacity-70">30 ml · All skin types</p>
            <div className="mt-3 flex items-center justify-between"><span>$38</span><span className="rounded px-2 py-0.5 text-xs" style={{ background: c.accent, color: readableOn(c.accent) }}>Best seller</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ColorsTab({ project: p, direction: d }: TabProps) {
  const toast = useToast();
  const [dark, setDark] = useState(false);
  const [exp, setExp] = useState<"css" | "json" | "dtcg" | "tailwind">("css");
  useGoogleFonts(d ? [d.fonts.heading, d.fonts.body] : [], true);
  if (!d) return <Notice>Select a direction first.</Notice>;
  const pal = d.palette;
  const patch = (fn: (pl: Palette) => Palette, msg?: string) => updateProject(p.id, (proj) => { const x = proj.directions.find((y) => y.id === d.id)!; x.palette = fn(x.palette); }, msg);
  const checks = contrastChecks(pal.colors);
  const exportText = { css: exportCss(pal.colors, d.name), json: exportJson(pal.colors), dtcg: exportDtcg(pal.colors), tailwind: exportTailwind(pal.colors) }[exp];
  const ext = { css: "css", json: "json", dtcg: "tokens.json", tailwind: "js" }[exp];
  const alts = p.altPalettes ?? [];

  const edit = (role: Role, raw: string) => { const h = normalizeHex(raw); if (h) patch((pl) => setColor(pl, role, h)); };
  const shuffle = (role: Role) => patch((pl) => { const { h, s, l } = hexToHsl(pl.colors[role]); return setColor(pl, role, hslToHex(h + 25 + Math.random() * 40, s, l)); }, `Replaced ${role} color`);
  const lock = (role: Role) => patch((pl) => ({ ...pl, locked: pl.locked.includes(role) ? pl.locked.filter((r) => r !== role) : [...pl.locked, role] }));
  const makeAlts = () => { updateProject(p.id, (proj) => { const base = proj.directions.find((y) => y.id === d.id)!.palette; proj.altPalettes = [0, 1, 2].map(() => regeneratePalette({ ...base, locked: base.locked })); }, "Generated 3 alternative palettes"); };

  return (
    <div className="rise">
      <SectionHead title="Color studio" desc={`Palette for “${d.name}”. Every change updates the preview instantly and is saved to this project.`} right={<><Button size="sm" onClick={() => patch((pl) => regeneratePalette(pl), "Regenerated palette")}>↻ Regenerate (keeps locked)</Button><CopyButton text={ROLES.map((r) => `${r}: ${pal.colors[r]}`).join("\n")} label="Copy all HEX" what="Palette" /><Button size="sm" onClick={() => { updateProject(p.id, (proj) => { proj.savedPalettes = [{ ...pal, id: newId("pal") }, ...proj.savedPalettes]; }, `Saved palette ${pal.name}`); toast("Palette saved to project"); }}>Save palette</Button></>} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,430px)_1fr]">
        <Card className="divide-y divide-line">
          {ROLES.map((role) => {
            const hex = pal.colors[role];
            const locked = pal.locked.includes(role);
            return (
              <div key={role} className="flex flex-wrap items-center gap-3 p-3">
                <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-line-strong" style={{ background: hex }} title="Click to pick a color">
                  <input type="color" value={hex.toLowerCase()} onChange={(e) => edit(role, e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`Pick ${role} color`} />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-[13px] font-medium capitalize">{role}</span>{locked && <Badge tone="accent">locked</Badge>}</div>
                  <input aria-label={`${role} hex`} defaultValue={hex} key={hex} onBlur={(e) => { if (!normalizeHex(e.target.value)) { e.target.value = hex; toast("Enter a valid hex like #8B7CFF", "error"); } else edit(role, e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} className="mt-0.5 w-24 rounded border border-transparent bg-transparent px-0 font-mono text-xs uppercase text-fg hover:border-line focus:border-accent/50 focus:outline-none" />
                  <p className="font-mono text-[11px] text-faint">{rgbString(hex)} · {hslString(hex)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-1"><CopyButton text={hex} label="HEX" what={hex} /><CopyButton text={rgbString(hex)} label="RGB" what="RGB" /><CopyButton text={hslString(hex)} label="HSL" what="HSL" /></div>
                  <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => lock(role)} aria-pressed={locked}>{locked ? "🔒 Unlock" : "Lock"}</Button><Button size="sm" variant="ghost" onClick={() => shuffle(role)} title="Replace with a new hue, same lightness">Replace</Button></div>
                </div>
              </div>
            );
          })}
        </Card>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between"><div className="flex gap-2"><Chip active={!dark} onClick={() => setDark(false)}>Light</Chip><Chip active={dark} onClick={() => setDark(true)}>Dark (derived)</Chip></div><span className="text-xs text-faint">Live preview</span></div>
          <LivePreview colors={pal.colors} d={d} dark={dark} />
          <Card className="mt-4 p-4">
            <h3 className="text-sm font-medium">{pal.harmony} harmony</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{pal.mood}</p>
            <h3 className="mt-4 text-sm font-medium">Accessibility (WCAG 2.x, light theme)</h3>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {checks.map((k) => { const r = wcagRating(k.ratio); return (
                <li key={k.label} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[13px]"><span className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded border border-line-strong" style={{ background: pal.colors[k.bg] }}><span className="block text-center text-[9px] font-bold leading-4" style={{ color: k.label.startsWith("Button") ? readableOn(pal.colors.primary) : pal.colors[k.fg] }}>A</span></span>{k.label}</span><span className="flex items-center gap-2 font-mono text-xs">{k.ratio.toFixed(2)}:1<Badge tone={r.aa ? "ok" : r.aaLarge ? "warn" : "neutral"}>{r.label}</Badge></span></li>
              ); })}
            </ul>
            <p className="mt-2 text-[11px] text-faint">Dark theme text contrast: {contrast(darkTheme(pal.colors).text, darkTheme(pal.colors).background).toFixed(1)}:1 · computed with the WCAG relative-luminance formula.</p>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-1 text-sm font-medium">Semantic colors</h3>
          <p className="mb-3 text-xs text-muted">Status colors tuned to pass 4.5:1 on this palette&rsquo;s background. Hues follow convention (green, amber, red, blue), not your brand.</p>
          <ul className="grid gap-2 sm:grid-cols-2">{(Object.entries(semanticColors(pal.colors.background)) as [string, string][]).map(([k, v]) => <li key={k} className="flex items-center gap-2.5 rounded-lg border border-line p-2"><span className="h-8 w-8 shrink-0 rounded-md border border-line-strong" style={{ background: v }} /><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium capitalize">{k}</span><span className="block font-mono text-[11px] text-faint">{v} · {contrast(v, pal.colors.background).toFixed(1)}:1</span></span><CopyButton text={v} label="HEX" what={v} /></li>)}</ul>
        </Card>
        <Card className="p-4">
          <h3 className="mb-1 text-sm font-medium">Palette on real components</h3>
          <p className="mb-3 text-xs text-muted">Buttons, input, badge and alert using these exact colors.</p>
          <div className="space-y-3 rounded-lg p-4" style={{ background: pal.colors.background, color: pal.colors.text, border: `1px solid ${pal.colors.border}` }}>
            <div className="flex flex-wrap gap-2"><span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ background: pal.colors.primary, color: readableOn(pal.colors.primary) }}>Primary</span><span className="rounded-md px-3 py-1.5 text-sm" style={{ background: pal.colors.surface, border: `1px solid ${pal.colors.border}` }}>Secondary</span><span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ background: pal.colors.accent, color: readableOn(pal.colors.accent) }}>Accent</span></div>
            <div className="rounded-md px-3 py-2 text-sm" style={{ background: pal.colors.surface, border: `1px solid ${pal.colors.border}` }}>Input placeholder…</div>
            <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full px-2.5 py-1 font-semibold" style={{ background: pal.colors.secondary + "55" }}>Badge</span><span style={{ color: semanticColors(pal.colors.background).success }}>✓ Saved</span><span style={{ color: semanticColors(pal.colors.background).danger }}>✕ Error</span></div>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-medium">Gradient suggestions</h3>
          <div className="space-y-2.5">{pal.gradients.map((g) => (
            <div key={g.name} className="flex items-center gap-3"><div className="h-12 w-24 shrink-0 rounded-lg border border-line" style={{ background: g.css }} /><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{g.name}</p><p className="truncate font-mono text-[11px] text-faint">{g.css}</p></div><CopyButton text={`background: ${g.css};`} what="Gradient CSS" /></div>
          ))}</div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="flex gap-1.5">{(["css", "json", "dtcg", "tailwind"] as const).map((k) => <Chip key={k} active={exp === k} onClick={() => setExp(k)}>{{ css: "CSS variables", json: "JSON", dtcg: "Design Tokens (W3C)", tailwind: "Tailwind" }[k]}</Chip>)}</div><div className="flex gap-1.5"><CopyButton text={exportText} what="Export" /><Button size="sm" onClick={() => download(`palette.${ext}`, exportText, "text/plain")}>Download</Button></div></div>
          <pre className="scroll-thin max-h-60 overflow-auto rounded-lg bg-elevated p-3 font-mono text-[11.5px] leading-relaxed text-muted">{exportText}</pre>
        </Card>
      </div>

      <div className="mt-8">
        <SectionHead title="Alternative palettes" desc="Generated from this direction's hue family. Click one to apply it (your locked colors carry over)." right={<Button size="sm" onClick={makeAlts}>Generate 3 alternatives</Button>} />
        {alts.length === 0 ? <p className="text-sm text-faint">None yet.</p> : (
          <div className="grid gap-3 sm:grid-cols-3">{alts.map((a) => (
            <Card key={a.id} className="p-3">
              <div className="flex h-14 overflow-hidden rounded-lg border border-line">{ROLES.map((r) => <div key={r} className="flex-1" style={{ background: a.colors[r] }} title={a.colors[r]} />)}</div>
              <p className="mt-2 text-[13px] font-medium">{a.harmony}</p><p className="line-clamp-2 text-xs text-muted">{a.mood}</p>
              <Button size="sm" className="mt-2" onClick={() => { patch((pl) => ({ ...a, name: pl.name, locked: pl.locked }), `Applied ${a.harmony} palette`); toast("Palette applied"); }}>Use this palette</Button>
            </Card>
          ))}</div>
        )}
      </div>
      {p.savedPalettes.length > 0 && (
        <div className="mt-8"><h3 className="mb-2 text-sm font-medium">Saved palettes ({p.savedPalettes.length})</h3>
          <div className="flex flex-wrap gap-3">{p.savedPalettes.map((s) => <button key={s.id} onClick={() => patch((pl) => ({ ...s, name: pl.name }), "Restored saved palette")} className="rounded-lg border border-line p-1.5 hover:border-line-strong" title={`${s.harmony} — click to apply`}><div className="flex h-8 w-32 overflow-hidden rounded">{ROLES.slice(0, 5).map((r) => <div key={r} className="flex-1" style={{ background: s.colors[r] }} />)}</div></button>)}</div>
        </div>
      )}
    </div>
  );
}
