"use client";
import { useMemo, useState } from "react";
import { Check, Download, Loader2, Pin, RefreshCw, Sparkles } from "lucide-react";
import { Badge, Button, Card, EmptyState, Notice, SectionHead, useToast } from "../ui";
import type { TabProps } from "../workspace/shared";
import { BrandResearch } from "./BrandResearch";
import { BrandUnderstanding } from "./BrandUnderstanding";
import { ConceptDetail } from "./ConceptDetail";
import { LogoView } from "./LogoView";
import { useBrandFonts } from "./useBrand";
import { defaultProfile, describe, generateConcepts, initialsOf, nameIdeas } from "@/lib/brand/concepts";
import { brandKit, KIT_PARTS, type KitPart } from "@/lib/brand/export";
import { ARCH } from "@/lib/brand/render";
import type { BrandProfile, BrandState, ConceptSpec } from "@/lib/brand/types";
import { saveBlob } from "@/lib/download";
import { newId } from "@/lib/engine/palette";
import { updateProject } from "@/lib/store";
import type { Project } from "@/lib/types";

type Sub = "understanding" | "concepts" | "kit" | "research";
const SUBS: { id: Sub; label: string }[] = [{ id: "understanding", label: "1 · Brand understanding" }, { id: "concepts", label: "2 · Logo concepts" }, { id: "kit", label: "3 · Brand kit" }, { id: "research", label: "Research & prompts" }];

function initial(p: Project): BrandState { return { profile: { ...defaultProfile(p), nameIdeas: nameIdeas(p) }, concepts: [], selected: null, seed: 1, updatedAt: Date.now() }; }

export function BrandStudio({ project: p, direction: dir0, goto }: TabProps) {
  const toast = useToast();
  const d = dir0 ?? p.directions[0];
  const brand = p.brand ?? initial(p);
  const [sub, setSub] = useState<Sub>(brand.concepts.length ? "concepts" : "understanding");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [kitParts, setKitParts] = useState<KitPart[]>(KIT_PARTS.map((x) => x.id));
  const [kitBusy, setKitBusy] = useState<string | null>(null);
  const [kitResult, setKitResult] = useState<{ kind: "ok" | "error"; text: string; files?: string[] } | null>(null);
  const { fonts, error: fontsError } = useBrandFonts(brand.concepts);

  const mutate = (fn: (b: BrandState) => void, msg?: string) => updateProject(p.id, (x) => { x.brand ??= initial(x); fn(x.brand); x.brand.updatedAt = Date.now(); }, msg);
  const setProfile = (patch: Partial<BrandProfile>, msg?: string) => mutate((b) => {
    b.profile = { ...b.profile, ...patch };
    if (patch.name) b.concepts = b.concepts.map((c) => ({ ...c, name: b.profile.name, initials: initialsOf(b.profile.name) }));
  }, msg);
  const generate = () => { mutate((b) => { const seed = b.concepts.length ? b.seed + 1 : b.seed; b.seed = seed; b.concepts = generateConcepts(p, b.profile, d, seed, b.concepts); }, brand.concepts.length ? "Regenerated logo concepts" : "Generated logo concepts"); setSub("concepts"); };
  const update = (c: ConceptSpec) => mutate((b) => { b.concepts = b.concepts.map((x) => (x.id === c.id ? c : x)); });
  const select = (id: string) => mutate((b) => { b.selected = id; }, "Selected a logo concept");
  const pin = (id: string) => mutate((b) => { b.concepts = b.concepts.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)); });
  const current = brand.concepts.find((c) => c.id === openId);
  const chosen = brand.concepts.find((c) => c.id === brand.selected) ?? brand.concepts[0];

  const toMoodboard = (c: ConceptSpec) => {
    updateProject(p.id, (x) => {
      let b = x.moodboards.find((m) => m.directionId === x.selectedDirection) ?? x.moodboards[0];
      if (!b) { b = { id: newId("mb"), name: "Brand board", directionId: x.selectedDirection ?? x.directions[0].id, items: [], updatedAt: 0 }; x.moodboards.unshift(b); }
      if (!b.items.some((i) => i.type === "logo" && i.concept.id === c.id)) b.items.push({ id: newId("mi"), type: "logo", title: `${ARCH[c.archetype].label}`, concept: c });
      b.updatedAt = Date.now();
    }, "Added a logo concept to a moodboard");
    toast("Added to your moodboard");
  };
  const savePalette = (c: ConceptSpec) => {
    updateProject(p.id, (x) => { x.savedPalettes.unshift({ id: newId("pal"), name: `${c.name} logo palette`, harmony: "From logo", mood: "The logo's colours applied to your selected direction's palette.", colors: { ...d.palette.colors, primary: c.palette.ink, accent: c.palette.accent, background: c.palette.bg }, locked: [], gradients: [] }); }, "Saved logo palette");
    toast("Saved to your palettes (Colors tab)");
  };
  const saveFonts = (c: ConceptSpec) => {
    updateProject(p.id, (x) => { x.savedFonts.unshift({ id: newId("font"), heading: c.font.family, body: d.fonts.body }); }, "Saved logo font");
    toast("Saved to your fonts (Typography tab)");
  };

  async function buildKit() {
    if (!fonts || !chosen) return;
    setKitBusy("Starting…"); setKitResult(null);
    try { const r = await brandKit(kitParts, chosen, brand.profile, d, fonts, (s) => setKitBusy(s)); saveBlob(r.name, r.bytes as BlobPart, "application/zip"); setKitResult({ kind: "ok", text: `Saved ${r.name} with ${r.files.length} files.`, files: r.files }); toast("Brand kit downloaded"); }
    catch (e) { setKitResult({ kind: "error", text: e instanceof Error ? e.message : "The kit couldn't be built." }); }
    finally { setKitBusy(null); }
  }

  const cmp = useMemo(() => compare.map((id) => brand.concepts.find((c) => c.id === id)).filter((c): c is ConceptSpec => !!c), [compare, brand.concepts]);

  if (current && sub === "concepts") {
    return <div className="rise"><ConceptDetail key={current.id} spec={current} profile={brand.profile} direction={d} fonts={fonts} fontsError={fontsError} selected={brand.selected === current.id} onChange={update} onBack={() => setOpenId(null)} onSelect={() => select(current.id)} onPin={() => pin(current.id)} onMoodboard={() => toMoodboard(current)} onSavePalette={() => savePalette(current)} onSaveFonts={() => saveFonts(current)} onKit={() => { select(current.id); setOpenId(null); setSub("kit"); }} goto={goto} /></div>;
  }

  return (
    <div className="rise">
      <SectionHead title="Brand identity studio" desc="Describe the brand, compare original logo concepts built from your answers and your chosen direction, then export logo files and a brand kit." />
      <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Brand studio steps">{SUBS.map((s) => <button key={s.id} role="tab" aria-selected={sub === s.id} onClick={() => setSub(s.id)} className={`min-h-10 rounded-full border px-3.5 text-sm transition-colors ${sub === s.id ? "border-accent/50 bg-accent-soft text-fg" : "border-line text-muted hover:text-fg"}`}>{s.label}</button>)}</div>

      {sub === "understanding" && <BrandUnderstanding project={p} profile={brand.profile} onChange={setProfile} onNext={generate} />}

      {sub === "concepts" && (brand.concepts.length === 0 ? (
        <EmptyState icon={<Sparkles size={22} />} title="No logo concepts yet" action={<Button variant="primary" onClick={generate}>Generate logo concepts</Button>}>Six different approaches (wordmark, monogram, symbol and more) are chosen to fit your brand answers and drawn as real vector artwork. Nothing is sent to a server.</EmptyState>
      ) : (<>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-muted">{brand.concepts.length} concepts for <strong className="text-fg">{brand.profile.name}</strong>. Pinned concepts survive regenerating.</p>
          <div className="flex gap-2"><Button size="sm" onClick={generate}><RefreshCw size={14} aria-hidden />Regenerate unpinned</Button></div>
        </div>
        {fontsError && <div className="mb-3"><Notice tone="warn">The fonts for these logos couldn&rsquo;t be loaded. Previews and exports need them; check your connection and reload.</Notice></div>}
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {brand.concepts.map((c) => {
            const a = describe(c, brand.profile), sel = brand.selected === c.id;
            return (
              <li key={c.id}><Card className={`flex h-full flex-col overflow-hidden p-0 ${sel ? "border-accent/70" : ""}`}>
                <div className="flex h-44 items-center justify-center p-6" style={{ background: c.palette.bg }}><LogoView spec={c} fonts={fonts} className="w-full max-w-[240px]" /></div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-1.5"><span className="text-sm font-medium">{ARCH[c.archetype].label}</span>{sel && <Badge tone="ok">My logo</Badge>}{c.pinned && <Badge>Pinned</Badge>}</div>
                  <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted">{a.idea}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                    <Button size="sm" variant="primary" onClick={() => setOpenId(c.id)}>Open</Button>
                    <Button size="sm" onClick={() => select(c.id)} disabled={sel}>{sel ? <><Check size={13} aria-hidden />Selected</> : "Use"}</Button>
                    <Button size="sm" onClick={() => pin(c.id)} aria-pressed={!!c.pinned} aria-label={`${c.pinned ? "Unpin" : "Pin"} ${ARCH[c.archetype].label}`}><Pin size={13} aria-hidden /></Button>
                    <label className="ml-auto inline-flex min-h-10 items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={compare.includes(c.id)} disabled={!compare.includes(c.id) && compare.length >= 3} onChange={(e) => setCompare(e.target.checked ? [...compare, c.id] : compare.filter((x) => x !== c.id))} />Compare</label>
                  </div>
                </div>
              </Card></li>);
          })}
        </ul>
        {cmp.length > 1 && (
          <Card className="mt-6 p-4"><h3 className="mb-3 text-sm font-semibold">Comparing {cmp.length} concepts</h3>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit,minmax(min(100%,${cmp.length === 3 ? 220 : 260}px),1fr))` }}>
              {cmp.map((c) => { const a = describe(c, brand.profile); return <div key={c.id} className="rounded-xl border border-line p-3"><div className="rounded-lg p-4" style={{ background: c.palette.bg }}><LogoView spec={c} fonts={fonts} className="mx-auto w-full max-w-[200px]" /></div><p className="mt-2 text-sm font-medium">{ARCH[c.archetype].label}</p><dl className="mt-1 space-y-1.5 text-xs text-muted"><div><dt className="text-faint">Personality</dt><dd>{a.personality}</dd></div><div><dt className="text-faint">Best for</dt><dd>{a.bestUse}</dd></div><div><dt className="text-faint">Weakness</dt><dd>{a.weakness}</dd></div></dl></div>; })}
            </div>
          </Card>)}
      </>))}

      {sub === "kit" && (
        !chosen ? <EmptyState title="Pick a logo first" action={<Button variant="primary" onClick={() => setSub("concepts")}>Go to logo concepts</Button>}>The brand kit is built from the logo concept you choose.</EmptyState> : (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <Card className="flex flex-col items-center justify-center gap-3 p-6" ><div className="w-full rounded-xl p-6" style={{ background: chosen.palette.bg }}><LogoView spec={chosen} fonts={fonts} className="mx-auto w-full max-w-[260px]" /></div><p className="text-sm">{ARCH[chosen.archetype].label} · {brand.selected === chosen.id ? "your selected logo" : "first concept (not selected yet)"}</p>
              <div className="flex flex-wrap justify-center gap-2"><Button size="sm" onClick={() => { setSub("concepts"); setOpenId(chosen.id); }}>Open concept</Button><Button size="sm" onClick={() => setSub("concepts")}>Switch concept</Button></div></Card>
            <Card className="p-4 sm:p-5">
              <h3 className="text-sm font-semibold">Brand kit contents</h3><p className="mb-3 mt-0.5 text-[13px] text-muted">One ZIP with the parts you tick. Logo files contain outlined lettering, so no fonts are needed to open them.</p>
              <ul className="grid gap-1.5">{KIT_PARTS.map((k) => <li key={k.id}><label className="flex min-h-11 items-start gap-2.5 rounded-lg border border-line p-2.5 text-sm hover:bg-hover/40"><input type="checkbox" className="mt-1" checked={kitParts.includes(k.id)} onChange={(e) => setKitParts(e.target.checked ? [...kitParts, k.id] : kitParts.filter((x) => x !== k.id))} /><span><span className="block">{k.label}</span><span className="text-xs text-faint">{k.hint}</span></span></label></li>)}</ul>
              <div className="mt-4 flex flex-wrap items-center gap-2"><Button variant="primary" onClick={buildKit} disabled={!!kitBusy || !fonts || kitParts.length === 0}>{kitBusy ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Download size={15} aria-hidden />}{kitBusy ? `Building: ${kitBusy}` : "Download brand kit (ZIP)"}</Button>{kitParts.length === 0 && <span className="text-xs text-faint">Tick at least one part.</span>}</div>
              <div role="status" aria-live="polite" className="mt-3">{kitResult && (kitResult.kind === "error" ? <Notice tone="warn"><strong>The kit failed.</strong> {kitResult.text}</Notice> : <Notice><span className="block"><strong>{kitResult.text}</strong></span><span className="mt-1 block max-h-40 overflow-auto font-mono text-[11px] text-faint">{kitResult.files?.map((f) => <span key={f} className="block">{f}</span>)}</span></Notice>)}</div>
            </Card>
          </div>
        )
      )}

      {sub === "research" && <BrandResearch project={p} direction={dir0} goto={goto} />}
    </div>
  );
}
