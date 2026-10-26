"use client";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/SiteChrome";
import { Badge, Button, Card } from "@/components/ui";
import { ARCHETYPES } from "@/lib/taxonomyClient";
import { makePalette } from "@/lib/engine/palette";
import { fontFamilyCss, explainPairing } from "@/lib/fonts";
import { FontLoader } from "@/components/FontLoader";
import { ROLES } from "@/lib/types";

export default function Explore() {
  const router = useRouter();
  const items = ARCHETYPES.map((a) => ({ a, pal: makePalette({ name: a.name, hue: a.hue, sat: a.sat, scheme: a.scheme, tone: a.tone, depth: a.depth }) }));
  return (
    <Shell>
      <FontLoader lite names={items.flatMap(({ a }) => [a.fonts.heading, a.fonts.body])} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Explore design directions</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">The ten creative directions DesignPilot builds from. Each one is a starting point — palette, type pairing, imagery and logo approach. Pick one to start a project in that style.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ a, pal }) => (
            <Card key={a.id} className="flex flex-col overflow-hidden">
              <div className="p-5" style={{ background: pal.colors.background, color: pal.colors.text }}>
                <p className="text-3xl leading-tight" style={{ fontFamily: fontFamilyCss(a.fonts.heading) }}>{a.name}</p>
                <p className="mt-1.5 text-[13px] opacity-75" style={{ fontFamily: fontFamilyCss(a.fonts.body) }}>{a.blurb}</p>
              </div>
              <div className="flex h-5">{ROLES.slice(0, 6).map((r) => <div key={r} className="flex-1" style={{ background: pal.colors[r] }} />)}</div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap gap-1">{a.mood.map((m) => <Badge key={m}>{m}</Badge>)}<Badge>{pal.harmony}</Badge></div>
                <p className="mt-3 text-xs text-muted"><span className="text-faint">Type:</span> {a.fonts.heading} + {a.fonts.body}</p>
                <p className="mt-1 text-xs text-muted"><span className="text-faint">Imagery:</span> {a.imageStyle}</p>
                <p className="mt-1 text-xs leading-relaxed text-faint">{explainPairing(a.fonts.heading, a.fonts.body)}</p>
                <Button className="mt-auto" variant="primary" size="sm" onClick={() => { try { sessionStorage.setItem("dp:prefill", JSON.stringify({ brief: `I want to design a digital product with a ${a.name.toLowerCase()} aesthetic: ${a.blurb.toLowerCase()} It should feel ${a.mood.join(", ")}. [Describe what you're building and who it's for.]`, style: a.keywords.slice(0, 3).join(", ") })); } catch { /* ignore */ } router.push("/#start"); }}>Start a project in this style</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
