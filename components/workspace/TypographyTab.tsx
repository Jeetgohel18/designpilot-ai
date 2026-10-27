"use client";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Chip, CopyButton, inputCls, Notice, SectionHead, useToast } from "../ui";
import { FONTS, cssSnippet, explainPairing, fallbackStack, fontByName, fontFamilyCss, googleFontsUrl, linkTag, type FontCategory } from "@/lib/fonts";
import { useGoogleFonts } from "../FontLoader";
import { updateProject } from "@/lib/store";
import { newId } from "@/lib/engine/palette";
import { BookmarkButton, type TabProps } from "./shared";

const CATS: FontCategory[] = ["serif", "sans-serif", "display", "monospace", "handwriting"];
type Live = { live: boolean; reason?: string; fonts?: Record<string, { rank: number; lastModified: string }>; total?: number };

export function TypographyTab({ project: p, direction: d }: TabProps) {
  const toast = useToast();
  const [sample, setSample] = useState("Considered design, beautifully set.");
  const [hSize, setHSize] = useState(48);
  const [cat, setCat] = useState<FontCategory | "all">("all");
  const [mood, setMood] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [read, setRead] = useState<"all" | "high">("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(12);
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => { fetch("/api/fonts").then((r) => r.json()).then(setLive).catch(() => setLive({ live: false, reason: "Couldn't reach the fonts endpoint." })); }, []);

  const moods = useMemo(() => [...new Set(FONTS.flatMap((f) => f.moods))].sort(), []);
  const industries = useMemo(() => [...new Set(FONTS.flatMap((f) => f.industries))].sort(), []);
  const list = useMemo(() => FONTS.filter((f) => (cat === "all" || f.category === cat) && (mood === "all" || f.moods.includes(mood)) && (industry === "all" || f.industries.includes(industry)) && (read === "all" || f.readability === "high") && (!q || f.name.toLowerCase().includes(q.toLowerCase()))), [cat, mood, industry, read, q]);

  useGoogleFonts([...(d ? [d.fonts.heading, d.fonts.body] : []), ...list.slice(0, shown).map((f) => f.name)], true);

  if (!d) return <Notice>Select a direction first.</Notice>;
  const setFont = (slot: "heading" | "body", name: string) => {
    updateProject(p.id, (proj) => { const x = proj.directions.find((y) => y.id === d.id)!; x.fonts[slot] = name; x.fontRationale = explainPairing(x.fonts.heading, x.fonts.body); }, `Set ${slot} font to ${name}`);
    toast(`${name} set as ${slot} font`);
  };
  const savePair = () => { updateProject(p.id, (proj) => { proj.savedFonts = [{ id: newId("fp"), heading: d.fonts.heading, body: d.fonts.body }, ...proj.savedFonts]; }, `Saved pairing ${d.fonts.heading} + ${d.fonts.body}`); toast("Font pairing saved"); };
  const c = d.palette.colors;
  const rank = (n: string) => live?.live ? live.fonts?.[n] : undefined;

  return (
    <div className="rise">
      <SectionHead title="Typography" desc={`Pairing for “${d.name}”. Edit the sample text, change either font from the catalog below, and copy production-ready snippets.`} right={<Badge tone="neutral" title="Mood and industry tags are DesignPilot's editorial judgement">Catalog: curated · metadata: {live?.live ? "live Google Fonts API" : "not live"}</Badge>} />

      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8" style={{ background: c.background, color: c.text }}>
          <input aria-label="Sample heading text" value={sample} onChange={(e) => setSample(e.target.value)} className="w-full bg-transparent leading-[1.1] outline-none" style={{ fontFamily: fontFamilyCss(d.fonts.heading), fontSize: hSize, color: c.text }} />
          <p className="mt-4 max-w-xl leading-relaxed opacity-80" style={{ fontFamily: fontFamilyCss(d.fonts.body), fontSize: 16 }}>
            Body copy set in {d.fonts.body}. Good typography is invisible: it guides the reader, sets the tone and makes content feel effortless to read on any screen, from a phone to a studio display.
          </p>
        </div>
        <div className="grid gap-4 border-t border-line p-4 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm"><span className="text-faint">Heading</span> <strong>{d.fonts.heading}</strong> <span className="mx-1 text-faint">+</span> <span className="text-faint">Body</span> <strong>{d.fonts.body}</strong></p>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted"><span className="text-faint">Why it works (generated): </span>{d.fontRationale}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <label className="flex items-center gap-2 text-xs text-muted">Size <input type="range" min={24} max={96} value={hSize} onChange={(e) => setHSize(+e.target.value)} aria-label="Heading size" /> {hSize}px</label>
            <Button size="sm" onClick={savePair}>Save pairing</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-4">
        <h3 className="mb-1 text-sm font-medium">Type roles in this direction</h3>
        <p className="mb-4 text-[13px] text-muted">How each typeface is used. These samples update when you change direction or swap a font.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {([["Heading", d.fonts.heading, "Page and section titles. It gives the brand its voice.", { fontSize: 30, lineHeight: 1.1, fontWeight: 600 }], ["Body", d.fonts.body, "Paragraphs and interface text. Chosen for comfortable reading.", { fontSize: 16, lineHeight: 1.6 }], ["Label", d.fonts.body, "Form labels, metadata and captions, set small and spaced.", { fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }], ["Button", d.fonts.body, "Calls to action. Short, bold and easy to scan.", { fontSize: 14, fontWeight: 600 }]] as const).map(([role, font, why, st]) => (
            <div key={role} className="rounded-lg border border-line p-3">
              <div className="flex items-baseline justify-between gap-2"><span className="text-xs font-medium text-muted">{role}</span><span className="truncate text-[11px] text-faint">{font}</span></div>
              <div className="my-3 min-h-10" style={{ fontFamily: fontFamilyCss(font), color: c.text, background: c.background, padding: 10, borderRadius: 8, ...st }}>{role === "Button" ? <span style={{ background: c.primary, color: c.background, padding: "8px 14px", borderRadius: 6, display: "inline-block" }}>Shop the routine</span> : role === "Label" ? "Skin type" : role === "Body" ? "Gentle formulas for everyday use." : "Radiant, honest skin."}</div>
              <p className="text-xs leading-relaxed text-faint">{why}</p>
            </div>
          ))}
        </div>
        <h4 className="mb-1.5 mt-5 text-xs font-medium text-muted">Fallback font stacks</h4>
        <div className="space-y-1.5">{[d.fonts.heading, d.fonts.body].map((f) => <div key={f} className="flex items-center justify-between gap-2 rounded-lg bg-elevated px-3 py-2"><code className="min-w-0 truncate font-mono text-[11.5px] text-muted">{fontFamilyCss(f)}</code><CopyButton text={`font-family: ${fontFamilyCss(f)};`} what="font-family" /></div>)}</div>
        <p className="mt-2 text-xs text-faint">Fallback: {fallbackStack(d.fonts.heading)}. If Google Fonts is blocked, the page uses this fallback.</p>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-medium">CSS</h3><CopyButton text={cssSnippet(d.fonts)} what="CSS" /></div>
          <pre className="scroll-thin max-h-56 overflow-auto rounded-lg bg-elevated p-3 font-mono text-[11.5px] leading-relaxed text-muted">{cssSnippet(d.fonts)}</pre>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-medium">HTML &lt;link&gt; &amp; font-family</h3><CopyButton text={linkTag([d.fonts.heading, d.fonts.body])} what="Link tags" /></div>
          <pre className="scroll-thin max-h-56 overflow-auto rounded-lg bg-elevated p-3 font-mono text-[11.5px] leading-relaxed text-muted">{linkTag([d.fonts.heading, d.fonts.body])}</pre>
          <div className="mt-3 flex flex-wrap gap-2"><CopyButton text={`font-family: ${fontFamilyCss(d.fonts.heading)};`} label="Copy heading font-family" /><CopyButton text={`font-family: ${fontFamilyCss(d.fonts.body)};`} label="Copy body font-family" /><CopyButton text={googleFontsUrl([d.fonts.heading, d.fonts.body])} label="Copy Google Fonts URL" /></div>
        </Card>
      </div>

      <h3 className="mt-10 mb-3 text-base font-semibold">Font explorer</h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input aria-label="Search fonts" placeholder="Search fonts…" value={q} onChange={(e) => { setQ(e.target.value); setShown(12); }} className={`${inputCls} !w-48`} />
        <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>{CATS.map((c) => <Chip key={c} active={cat === c} onClick={() => { setCat(c); setShown(12); }}>{c}</Chip>)}
        <select aria-label="Filter by mood" className={`${inputCls} !w-auto`} value={mood} onChange={(e) => setMood(e.target.value)}><option value="all">Any mood</option>{moods.map((m) => <option key={m}>{m}</option>)}</select>
        <select aria-label="Filter by industry" className={`${inputCls} !w-auto`} value={industry} onChange={(e) => setIndustry(e.target.value)}><option value="all">Any industry</option>{industries.map((m) => <option key={m}>{m}</option>)}</select>
        <Chip active={read === "high"} onClick={() => setRead(read === "high" ? "all" : "high")}>High readability only</Chip>
      </div>
      {live && !live.live && <div className="mb-4"><Notice>Live font metadata (popularity, last updated) is off: {live.reason} Add <code className="rounded bg-elevated px-1">GOOGLE_FONTS_API_KEY</code> to enable it. Everything shown here comes from the curated catalog.</Notice></div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.slice(0, shown).map((f) => {
          const r = rank(f.name);
          return (
            <Card key={f.name} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-[13px] font-medium">{f.name}</p><p className="text-[11px] text-faint">{f.category} · {f.weights.length} weights{f.italic ? " · italic" : ""}</p></div>
                <BookmarkButton p={p} b={{ kind: "font", title: f.name, url: `https://fonts.google.com/specimen/${f.name.replace(/ /g, "+")}`, source: "Google Fonts" }} />
              </div>
              <p className="mt-3 truncate text-3xl leading-tight" style={{ fontFamily: fontFamilyCss(f.name) }}>{sample.slice(0, 22) || "Aa"}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{f.character}</p>
              <div className="mt-2 flex flex-wrap gap-1">{f.moods.map((m) => <Badge key={m}>{m}</Badge>)}{f.readability === "display-only" && <Badge tone="warn">large sizes</Badge>}{r && <Badge tone="ok" title={`Live Google Fonts API · updated ${r.lastModified}`}>popularity #{r.rank}</Badge>}</div>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                <Button size="sm" onClick={() => setFont("heading", f.name)} disabled={d.fonts.heading === f.name}>Use for headings</Button>
                <Button size="sm" onClick={() => setFont("body", f.name)} disabled={d.fonts.body === f.name || f.readability === "display-only"} title={f.readability === "display-only" ? "Display fonts aren't recommended for body text" : undefined}>Use for body</Button>
                <a href={`https://fonts.google.com/specimen/${f.name.replace(/ /g, "+")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 items-center rounded-lg px-2 text-xs text-muted hover:text-fg">Google Fonts ↗</a>
              </div>
            </Card>
          );
        })}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted">No fonts match these filters.</p>}
      {shown < list.length && <div className="mt-4 text-center"><Button onClick={() => setShown(shown + 12)}>Show more ({list.length - shown})</Button></div>}
      {fontByName(d.fonts.heading) === undefined && <div className="mt-4"><Notice tone="warn">{d.fonts.heading} isn&rsquo;t in the curated catalog — check it exists on Google Fonts before using it.</Notice></div>}
    </div>
  );
}
