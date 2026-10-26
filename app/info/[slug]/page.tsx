import { notFound } from "next/navigation";
import { Shell } from "@/components/SiteChrome";
import { BRAND, FOOTER } from "@/lib/brand";

const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  about: { title: "About", body: (<><p>{BRAND.name} is a design research workspace. You describe a project; it produces a structured analysis, three creative directions, type and color systems, curated source links for references, brand, icons, illustrations and photography, and developer-ready tokens.</p><p>It is deliberately honest: suggestions are labelled as AI-generated, locally generated, curated or live-API data, and it never invents links or screenshots.</p></>) },
  contact: { title: "Contact", body: FOOTER.contactEmail ? <p>Email <a className="text-accent underline" href={`mailto:${FOOTER.contactEmail}`}>{FOOTER.contactEmail}</a>.</p> : <p>No contact address is configured yet. Set <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">FOOTER.contactEmail</code> in <code className="rounded bg-elevated px-1.5 py-0.5 text-sm">lib/brand.ts</code> and this page will show it.</p> },
  privacy: { title: "Privacy", body: (<><p>This prototype has no accounts. Your projects are stored in your own browser (localStorage) and never leave your device unless you choose to share one.</p><p>When you create a share link, a snapshot of that project is stored on the server and is publicly readable by anyone with the link until you disable it. Private projects are never uploaded.</p><p>If the operator has configured an AI key, the project description you submit is sent to that AI provider to produce the analysis. Third-party sources (Google Fonts, Unsplash, Brave Search, Iconify) receive the requests needed to fetch their content.</p><p><strong>Placeholder text.</strong> Have this reviewed before a public launch.</p></>) },
  terms: { title: "Terms", body: (<><p>{BRAND.name} provides design suggestions as-is. Suggestions are not professional, legal or licensing advice. Always confirm the licence of any font, icon, illustration or photo on its source before commercial use.</p><p>Generated logo concepts are original descriptions for inspiration and are not endorsed by, or affiliated with, any existing brand.</p><p><strong>Placeholder text.</strong> Have this reviewed before a public launch.</p></>) },
};

export function generateStaticParams() { return Object.keys(PAGES).map((slug) => ({ slug })); }

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-muted">{page.body}</div>
      </div>
    </Shell>
  );
}
