"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button, useCopy } from "./ui";
import { BRAND, FOOTER } from "@/lib/brand";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/discover", label: "Discover" },
  { href: "/resources", label: "Resources" },
  { href: "/projects", label: "My Projects" },
];

export function ShareSiteButton({ compact }: { compact?: boolean }) {
  const copy = useCopy();
  async function share() {
    const url = typeof window !== "undefined" ? window.location.origin : BRAND.siteUrl;
    const data = { title: BRAND.name, text: BRAND.tagline, url };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try { await navigator.share(data); return; } catch (e) { if ((e as Error).name === "AbortError") return; }
    }
    await copy(url, "Link");
  }
  return (
    <Button size="sm" onClick={share} aria-label={`Share ${BRAND.name}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="m16 6-4-4-4 4" /><path d="M12 2v14" /></svg>
      {!compact && "Share"}
    </Button>
  );
}

export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={`${BRAND.name} home`}><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined} className={`rounded-md px-3 py-1.5 text-sm transition-colors ${path === l.href ? "bg-hover text-fg" : "text-muted hover:text-fg"}`}>{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ShareSiteButton />
          <Link href="/#start" className="hidden sm:block"><Button size="sm" variant="primary">New project</Button></Link>
          <button className="rounded-md p-2 text-muted hover:bg-hover md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-line px-4 py-2 md:hidden">
          {LINKS.concat([{ href: "/#start", label: "New project" }]).map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2.5 text-sm text-muted hover:bg-hover hover:text-fg">{l.label}</Link>)}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{BRAND.tagline}</p>
        </div>
        <FooterCol title="Product" links={[["Explore", "/explore"], ["Discover", "/discover"], ["Resources", "/resources"], ["My Projects", "/projects"]]} />
        <FooterCol title="Company" links={[["About", "/info/about"], ["Contact", "/info/contact"], ["Privacy", "/info/privacy"], ["Terms", "/info/terms"]]} />
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">Social</h3>
          <ul className="space-y-2 text-sm">
            {FOOTER.social.map((s) => <li key={s.label}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fg">{s.label}</a></li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-faint">© {new Date().getFullYear()} {BRAND.name}. Prototype — suggestions are not verified research.</div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-faint">{title}</h3>
      <ul className="space-y-2 text-sm">{links.map(([l, h]) => <li key={h}><Link href={h} className="text-muted hover:text-fg">{l}</Link></li>)}</ul>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (<><SiteNav /><main className="flex-1">{children}</main><SiteFooter /></>);
}
