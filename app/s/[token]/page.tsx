import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readShare } from "@/lib/server/shares";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import { FontLoader } from "@/components/FontLoader";
import { fontFamilyCss } from "@/lib/fonts";
import { ROLES } from "@/lib/types";
import { MoodCard } from "@/components/workspace/MoodCard";
import { itemSpan } from "@/lib/mood";
import { ShareSiteButton } from "@/components/SiteChrome";
import type { MoodItem } from "@/lib/types";

type Props = { params: Promise<{ token: string }> };
const valid = (t: string) => /^[A-Za-z0-9_-]{8,40}$/.test(t);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const s = valid(token) ? await readShare(token) : null;
  if (!s) return { title: "Not found", robots: { index: false } };
  const title = s.kind === "moodboard" ? `${s.snapshot.moodboards[0]?.name ?? s.snapshot.name} — moodboard` : `${s.snapshot.name} — design workspace`;
  const description = s.snapshot.profile.summary.slice(0, 200);
  return { title, description, robots: { index: false, follow: false }, openGraph: { title, description, type: "article", siteName: BRAND.name }, twitter: { card: "summary", title, description } };
}

export default async function SharedPage({ params }: Props) {
  const { token } = await params;
  const share = valid(token) ? await readShare(token) : null;
  if (!share) notFound();
  const { snapshot: s, kind } = share;
  const sel = s.directions.find((d) => d.id === s.selectedDirection) ?? s.directions[0];
  const fonts = s.directions.flatMap((d) => [d.fonts.heading, d.fonts.body]).concat(s.moodboards.flatMap((b) => b.items.flatMap((i: MoodItem) => (i.type === "type" ? [i.heading, i.body] : []))));
  const boards = s.moodboards;

  return (
    <div className="min-h-screen">
      <FontLoader names={fonts} lite />
      <header className="border-b border-line"><div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href="/"><Logo /></Link><div className="flex items-center gap-2"><span className="hidden rounded-md border border-line px-2 py-1 text-xs text-muted sm:inline">Shared · read-only</span><ShareSiteButton compact /><Link href="/#start" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-[#0b0a14]">Make your own</Link></div></div></header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs uppercase tracking-wider text-faint">{kind === "moodboard" ? "Moodboard" : "Design workspace"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{kind === "moodboard" ? boards[0]?.name ?? s.name : s.name}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{s.profile.summary}</p>

        {kind === "project" && (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
              {[["Project type", s.profile.projectType], ["Industry", s.profile.industry], ["Audience", s.profile.audience]].map(([k, v]) => <div key={k} className="rounded-xl border border-line bg-surface p-4"><dt className="text-xs text-faint">{k}</dt><dd className="mt-1">{v}</dd></div>)}
            </dl>
            <h2 className="mt-12 text-lg font-semibold">Creative directions</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {s.directions.map((d) => { const c = d.palette.colors; const isSel = d.id === sel?.id && s.selectedDirection; return (
                <article key={d.id} className={`overflow-hidden rounded-xl border bg-surface ${isSel ? "border-accent/60" : "border-line"}`}>
                  <div className="p-5" style={{ background: c.background, color: c.text }}><p className="text-2xl leading-tight" style={{ fontFamily: fontFamilyCss(d.fonts.heading) }}>{d.name}</p><p className="mt-1 text-xs opacity-75" style={{ fontFamily: fontFamilyCss(d.fonts.body) }}>{d.fonts.heading} + {d.fonts.body}</p></div>
                  <div className="flex h-6">{ROLES.map((r) => <div key={r} className="flex-1" style={{ background: c[r] }} title={`${r} ${c[r]}`} />)}</div>
                  <div className="p-4 text-[13px]"><p className="leading-relaxed text-muted">{d.summary}</p>{isSel && <p className="mt-2 text-xs text-accent">★ Selected direction</p>}<p className="mt-3 font-mono text-[11px] text-faint">{ROLES.map((r) => c[r]).join(" ")}</p></div>
                </article>
              ); })}
            </div>
          </>
        )}
        {boards.length > 0 && (
          <section className="mt-12">
            {kind === "project" && <h2 className="text-lg font-semibold">Moodboards</h2>}
            {boards.map((b) => (<div key={b.id} className="mt-4">{kind === "project" && <h3 className="mb-2 text-sm text-muted">{b.name}</h3>}<ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4">{b.items.map((i) => <li key={i.id} className={itemSpan(i)}><MoodCard item={i} /></li>)}</ul></div>))}
          </section>
        )}
        <p className="mt-14 border-t border-line pt-4 text-xs text-faint">Snapshot shared from {BRAND.name}. Suggestions are generated and not verified research; confirm font, icon and image licences at their sources.</p>
      </main>
    </div>
  );
}
