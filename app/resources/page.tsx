import { Shell } from "@/components/SiteChrome";
import { Badge, Card } from "@/components/ui";
import { ICON_LIBRARIES, ILLUSTRATION_SOURCES, TOOLS, UI_RESOURCES, type SourceLink } from "@/lib/engine/resources";

export const metadata = { title: "Resources" };

function Grid({ title, desc, items }: { title: string; desc?: string; items: (SourceLink & { styles?: string[] })[] }) {
  return (
    <section className="mt-12"><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{desc && <p className="mt-1 max-w-2xl text-sm text-muted">{desc}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((l) => (
        <Card key={l.name} className="flex flex-col p-4"><div className="flex items-start justify-between gap-2"><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-accent">{l.name} ↗</a></div><p className="mt-1.5 text-[13px] text-muted">{l.note}</p>
          <div className="mt-3 flex flex-wrap gap-1">{l.styles?.map((s) => <Badge key={s}>{s}</Badge>)}{l.license && <Badge title="As last documented by us — confirm on the source">{l.license}</Badge>}</div></Card>
      ))}</div></section>
  );
}

export default function Resources() {
  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">A curated directory of real tools and asset sources. Licence notes reflect what each project documented when we last checked — always confirm on the source before commercial use.</p>
        <Grid title="Icon libraries" items={ICON_LIBRARIES} />
        <Grid title="Illustrations" items={ILLUSTRATION_SOURCES} />
        <Grid title="UI kits, components & frameworks" items={UI_RESOURCES} />
        <Grid title="Design tools" items={TOOLS} />
      </div>
    </Shell>
  );
}
