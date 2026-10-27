"use client";
import { useMemo, useState } from "react";
import { BookOpen, Home, LayoutGrid, Menu, MoonStar, Search, Sun, User, X } from "lucide-react";
import { Badge, Button, Card, Chip, CopyButton, Notice, SectionHead, download } from "../ui";
import { useGoogleFonts } from "../FontLoader";
import { fontFamilyCss } from "@/lib/fonts";
import { readableOn } from "@/lib/color";
import { darkTheme, semanticColors } from "@/lib/engine/palette";
import { uiStyleOf } from "@/lib/engine/uistyle";
import { BASE_CSS, GROUPS, groupSnippet, scopeCss, type GroupId } from "@/lib/engine/componentCss";
import { componentsCssFile } from "@/lib/engine/exports";
import type { TabProps } from "./shared";

const SCOPE = ".dp-stage";
const Row = ({ label, children }: { label?: string; children: React.ReactNode }) => (
  <div className="mb-4 last:mb-0">{label && <p className="mb-2 text-[11px] font-medium uppercase tracking-wider opacity-60">{label}</p>}<div className="flex flex-wrap items-center gap-3">{children}</div></div>
);

function Buttons() {
  const [saving, setSaving] = useState(false);
  return (<>
    <Row label="Variants"><button className="ds-btn ds-btn--primary">Primary</button><button className="ds-btn ds-btn--secondary">Secondary</button><button className="ds-btn ds-btn--ghost">Ghost</button><button className="ds-btn ds-btn--danger">Delete</button></Row>
    <Row label="States (forced so you can see them)"><button className="ds-btn ds-btn--primary">Default</button><button className="ds-btn ds-btn--primary is-hover">Hover</button><button className="ds-btn ds-btn--primary is-focus">Focus</button><button className="ds-btn ds-btn--primary" disabled>Disabled</button><button className="ds-btn ds-btn--primary is-loading" aria-busy="true">Loading</button></Row>
    <Row label="Try it"><button className={`ds-btn ds-btn--primary ${saving ? "is-loading" : ""}`} aria-busy={saving} onClick={() => { setSaving(true); setTimeout(() => setSaving(false), 1400); }}>Save changes</button><span className="text-xs opacity-60">Click to see the loading state</span></Row>
  </>);
}

function Inputs() {
  const [v, setV] = useState("");
  return (<div className="grid max-w-md gap-4">
    <div className="ds-field"><label htmlFor="ds-e">Email</label><input id="ds-e" className="ds-input" type="email" placeholder="you@example.com" /><span className="ds-help">We&rsquo;ll never share it.</span></div>
    <div className="ds-field"><label htmlFor="ds-n">Name (error state)</label><input id="ds-n" className="ds-input is-error" aria-invalid="true" aria-describedby="ds-n-e" defaultValue="" /><span id="ds-n-e" className="ds-error">Please enter your name.</span></div>
    <div className="ds-field"><label htmlFor="ds-d">Disabled</label><input id="ds-d" className="ds-input" disabled value="Not editable" readOnly /></div>
    <div className="ds-search"><Search size={16} aria-hidden /><input className="ds-input" type="search" aria-label="Search" placeholder="Search products…" value={v} onChange={(e) => setV(e.target.value)} /></div>
    <textarea className="ds-textarea" aria-label="Message" placeholder="Message…" />
    <select className="ds-select" aria-label="Plan"><option>Starter</option><option>Pro</option><option>Team</option></select>
  </div>);
}

function Controls() {
  const [r, setR] = useState("monthly"); const [vol, setVol] = useState(40);
  return (<div className="grid max-w-sm gap-1">
    <label className="ds-check"><input type="checkbox" defaultChecked /> Email me updates</label>
    <label className="ds-check"><input type="checkbox" /> Share anonymous usage</label>
    {["monthly", "yearly"].map((x) => <label key={x} className="ds-radio"><input type="radio" name="ds-plan" checked={r === x} onChange={() => setR(x)} /> {x[0].toUpperCase() + x.slice(1)} billing</label>)}
    <label className="ds-toggle"><input type="checkbox" role="switch" defaultChecked /> Notifications</label>
    <label className="ds-field mt-2">Volume: {vol}<input className="ds-range" type="range" min={0} max={100} value={vol} onChange={(e) => setVol(+e.target.value)} aria-label="Volume" /></label>
  </div>);
}

function Navigation() {
  const [tab, setTab] = useState(0);
  return (<div className="grid gap-5">
    <nav className="ds-nav" aria-label="Main (preview)"><b style={{ fontFamily: "var(--font-heading)" }}>Brand</b><span><a href="#" onClick={(e) => e.preventDefault()} aria-current="page">Home</a><a href="#" onClick={(e) => e.preventDefault()}>Shop</a><a href="#" onClick={(e) => e.preventDefault()}>About</a></span></nav>
    <div className="flex flex-wrap items-start gap-4"><div className="ds-side"><a href="#" onClick={(e) => e.preventDefault()} aria-current="page">Dashboard</a><a href="#" onClick={(e) => e.preventDefault()}>Orders</a><a href="#" onClick={(e) => e.preventDefault()}>Customers</a><a href="#" onClick={(e) => e.preventDefault()}>Settings</a></div>
      <div className="min-w-[220px] flex-1"><div role="tablist" className="ds-tabs">{["Overview", "Details", "Reviews"].map((t, i) => <button key={t} role="tab" aria-selected={tab === i} className="ds-tab" onClick={() => setTab(i)}>{t}</button>)}</div><p className="mt-3 text-sm opacity-80">Showing the <b>{["Overview", "Details", "Reviews"][tab]}</b> panel.</p></div></div>
    <nav className="ds-crumbs" aria-label="Breadcrumb"><a href="#" onClick={(e) => e.preventDefault()}>Home</a><span aria-hidden>/</span><a href="#" onClick={(e) => e.preventDefault()}>Shop</a><span aria-hidden>/</span><span aria-current="page">Serum</span></nav>
  </div>);
}

function Cards() {
  return (<div className="grid gap-4 sm:grid-cols-3">
    <article className="ds-card ds-card--link"><h3>Barrier serum</h3><p>Three ingredients. Daily use.</p></article>
    <article className="ds-card"><h3>Content panel</h3><p>Static card without hover behaviour.</p></article>
    <div className="ds-card ds-stat"><b>12.4k</b><span>Orders this month</span></div>
  </div>);
}

function Data() {
  const rows = [["#1042", "Shipped", 68], ["#1041", "Processing", 124], ["#1040", "Delivered", 38]] as const;
  const [asc, setAsc] = useState(true);
  const sorted = useMemo(() => [...rows].sort((a, b) => (asc ? a[2] - b[2] : b[2] - a[2])), [asc]); // eslint-disable-line react-hooks/exhaustive-deps
  return (<div className="grid gap-4">
    <div className="ds-tablewrap"><table className="ds-table"><thead><tr><th scope="col">Order</th><th scope="col">Status</th><th scope="col" aria-sort={asc ? "ascending" : "descending"}><button onClick={() => setAsc(!asc)}>Total {asc ? "▲" : "▼"}</button></th></tr></thead><tbody>{sorted.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td>${c}</td></tr>)}</tbody></table></div>
    <ul className="ds-list"><li><span>Barrier serum</span><b>$38</b></li><li><span>Daily cleanser</span><b>$24</b></li><li><span>SPF 40</span><b>$30</b></li></ul>
  </div>);
}

function Overlays() {
  const [o, setO] = useState<"dialog" | "drawer" | null>(null); const [pop, setPop] = useState(false);
  return (<div className="relative min-h-[300px]">
    <Row><button className="ds-btn ds-btn--secondary" onClick={() => setO("dialog")}>Open dialog</button><button className="ds-btn ds-btn--secondary" onClick={() => setO("drawer")}>Open drawer</button>
      <span className="ds-popwrap"><button className="ds-btn ds-btn--secondary" aria-expanded={pop} onClick={() => setPop(!pop)}>Popover</button>{pop && <div className="ds-popover" role="dialog" aria-label="Details">Popovers hold short, secondary info. Close with the button again.</div>}</span></Row>
    {o === "dialog" && <div className="ds-scrim" onKeyDown={(e) => e.key === "Escape" && setO(null)}><div role="dialog" aria-modal="true" aria-labelledby="ds-t" className="ds-dialog"><h3 id="ds-t">Delete project?</h3><p>This can&rsquo;t be undone.</p><div className="row"><button autoFocus className="ds-btn ds-btn--secondary" onClick={() => setO(null)}>Cancel</button><button className="ds-btn ds-btn--danger" onClick={() => setO(null)}>Delete</button></div></div></div>}
    {o === "drawer" && <aside className="ds-drawer" aria-label="Filters" onKeyDown={(e) => e.key === "Escape" && setO(null)}><div className="flex items-center justify-between"><b style={{ fontFamily: "var(--font-heading)" }}>Filters</b><button className="ds-iconbtn" aria-label="Close drawer" onClick={() => setO(null)}><X size={18} /></button></div><p className="mt-3 text-sm opacity-80">Drawers keep context on the page; ideal for filters on mobile.</p></aside>}
  </div>);
}

function Feedback() {
  const [toast, setToast] = useState(false); const [tip, setTip] = useState(false);
  return (<div className="grid max-w-lg gap-3">
    {([["success", "Saved", "Your changes are live.", "✓"], ["warning", "Almost there", "Add a shipping address to continue.", "!"], ["danger", "Payment failed", "Check your card details and try again.", "✕"], ["info", "Tip", "You can drag cards to reorder them.", "i"]] as const).map(([k, t, m, i]) => <div key={k} className={`ds-alert ds-alert--${k}`} role={k === "danger" ? "alert" : "status"}><span aria-hidden>{i}</span><div><b>{t}</b><p>{m}</p></div></div>)}
    <Row><span className="ds-badge">New</span><span className="ds-badge">Best seller</span>
      <span className="ds-tipwrap" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>{tip && <span className="ds-tip" role="tooltip">Hover or focus for help</span>}<button className="ds-btn ds-btn--secondary" onFocus={() => setTip(true)} onBlur={() => setTip(false)} aria-describedby={tip ? "ds-tip" : undefined}>Tooltip</button></span>
      <button className="ds-btn ds-btn--secondary" onClick={() => { setToast(true); setTimeout(() => setToast(false), 2200); }}>Show toast</button></Row>
    {toast && <div className="ds-toast" role="status">Added to cart</div>}
  </div>);
}

function Menus() {
  const [o, setO] = useState(true); const [last, setLast] = useState("");
  const items = ["Rename", "Duplicate", "Delete"];
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const els = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')); const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); els[(i + 1) % els.length]?.focus(); } if (e.key === "ArrowUp") { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); } if (e.key === "Escape") setO(false);
  };
  return (<div className="min-h-[220px]"><span className="ds-menuwrap" onKeyDown={onKey}><button className="ds-btn ds-btn--secondary" aria-haspopup="menu" aria-expanded={o} onClick={() => setO(!o)}>Actions ▾</button>
    {o && <div className="ds-menu" role="menu">{items.map((x, i) => <span key={x} className="contents">{i === 2 && <hr />}<button role="menuitem" onClick={() => { setLast(x); setO(false); }}>{x}</button></span>)}</div>}</span>
    <p className="mt-3 text-sm opacity-70">{last ? `Chose: ${last}` : "Use ↑ ↓ to move, Esc to close."}</p></div>);
}

function Forms() {
  const [f, setF] = useState({ n: "", e: "", t: false }); const [err, setErr] = useState<Record<string, string>>({}); const [ok, setOk] = useState(false);
  const validate = (x = f) => { const r: Record<string, string> = {}; if (!x.n.trim()) r.n = "Please enter your name."; if (!/^\S+@\S+\.\S+$/.test(x.e)) r.e = "Enter a valid email like name@example.com."; if (!x.t) r.t = "You need to accept the terms."; return r; };
  return (<form className="ds-form" noValidate onSubmit={(e) => { e.preventDefault(); const r = validate(); setErr(r); setOk(!Object.keys(r).length); }}>
    <div className="ds-field"><label htmlFor="f-n">Full name</label><input id="f-n" className={`ds-input ${err.n ? "is-error" : ""}`} aria-invalid={!!err.n} aria-describedby="f-n-e" value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} onBlur={() => setErr({ ...err, n: validate().n ?? "" })} /><span id="f-n-e" className="ds-error" role="alert">{err.n}</span></div>
    <div className="ds-field"><label htmlFor="f-e">Email</label><input id="f-e" type="email" className={`ds-input ${err.e ? "is-error" : ""}`} aria-invalid={!!err.e} aria-describedby="f-e-e" value={f.e} onChange={(e) => setF({ ...f, e: e.target.value })} onBlur={() => setErr({ ...err, e: validate().e ?? "" })} /><span id="f-e-e" className="ds-error" role="alert">{err.e}</span></div>
    <div><label className="ds-check"><input type="checkbox" checked={f.t} onChange={(e) => setF({ ...f, t: e.target.checked })} /> I agree to the terms</label>{err.t && <span className="ds-error" role="alert">{err.t}</span>}</div>
    <button className="ds-btn ds-btn--primary">Create account</button>
    {ok && <div className="ds-alert ds-alert--success" role="status"><span aria-hidden>✓</span><div><b>Looks good</b><p>The form passed validation.</p></div></div>}
  </form>);
}

function States() {
  return (<div className="grid gap-4 sm:grid-cols-2">
    <div className="ds-empty"><LayoutGrid size={22} className="mx-auto opacity-60" aria-hidden /><h3>No orders yet</h3><p>When you place an order it shows up here.</p><button className="ds-btn ds-btn--primary">Browse the shop</button></div>
    <div className="ds-card" aria-busy="true" aria-label="Loading content"><div className="ds-skel" style={{ height: 14, width: "55%" }} /><div className="ds-skel" style={{ height: 10, marginTop: 12 }} /><div className="ds-skel" style={{ height: 10, marginTop: 8, width: "85%" }} /><div className="ds-skel" style={{ height: 80, marginTop: 14 }} /></div>
  </div>);
}

function Mobile() {
  const [t, setT] = useState(0); const [open, setOpen] = useState(false);
  const tabs = [[Home, "Home"], [Search, "Search"], [BookOpen, "Saved"], [User, "Profile"]] as const;
  return (<div className="flex flex-wrap justify-center gap-6">
    {[false, true].map((drawer) => (
      <div key={String(drawer)} className="relative flex h-[420px] w-[230px] flex-col overflow-hidden rounded-[28px] border-4" style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}>
        <div className="ds-appbar">{drawer ? <button className="ds-iconbtn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(!open)}><Menu size={18} /></button> : <span className="w-11" />}<b style={{ fontFamily: "var(--font-heading)" }}>Brand</b><span className="w-11" /></div>
        <div className="flex-1 p-3 text-sm opacity-80">{drawer ? "Hamburger + drawer pattern" : `${tabs[t][1]} screen`}</div>
        {drawer && open && <div className="ds-drawer" style={{ left: 0, right: "auto", borderLeft: 0, borderRight: "1px solid var(--color-border)", width: "75%" }}><div className="grid gap-1 pt-10 text-sm">{tabs.map(([, l]) => <button key={l} className="ds-btn ds-btn--ghost justify-start" onClick={() => setOpen(false)}>{l}</button>)}</div></div>}
        {!drawer && <nav className="ds-tabbar" aria-label="Primary (preview)">{tabs.map(([I, l], i) => <button key={l} aria-current={t === i ? "page" : undefined} onClick={() => setT(i)}><I size={18} aria-hidden />{l}</button>)}</nav>}
      </div>))}
  </div>);
}

function Ecommerce() {
  const [f, setF] = useState(["All skin"]); const [qty, setQty] = useState(1);
  const chips = ["All skin", "Dry", "Oily", "Sensitive"];
  return (<div className="grid gap-5">
    <div role="group" aria-label="Filters" className="flex flex-wrap gap-2">{chips.map((c) => <button key={c} className="ds-chip" aria-pressed={f.includes(c)} onClick={() => setF(f.includes(c) ? f.filter((x) => x !== c) : [...f, c])}>{c}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-3">
      <article className="ds-product"><div className="img" /><div className="body"><span className="name">Barrier serum</span><span className="ds-price">$38</span><button className="ds-btn ds-btn--primary" onClick={() => setQty(qty + 1)}>Add to cart</button></div></article>
      <div className="ds-plan ds-plan--hot"><span className="ds-badge w-fit">Most popular</span><span className="big">$19</span><span className="text-sm opacity-70">per month · ritual box</span><button className="ds-btn ds-btn--primary">Subscribe</button></div>
      <div className="ds-card"><h3>Order summary</h3><div className="ds-sum"><div><span>Items ({qty})</span><span>${38 * qty}</span></div><div><span>Shipping</span><span>$5</span></div><div className="total"><span>Total</span><span>${38 * qty + 5}</span></div></div></div>
    </div>
  </div>);
}

function Dashboard() {
  const bars = [30, 52, 44, 68, 58, 80, 72];
  return (<div className="grid gap-4">
    <div className="ds-kpis"><div className="ds-kpi"><span>Revenue</span><b>$24.8k</b><i className="ds-up">▲ 12% vs last week</i></div><div className="ds-kpi"><span>Orders</span><b>1,204</b><i className="ds-up">▲ 4%</i></div><div className="ds-kpi"><span>Refund rate</span><b>1.2%</b><i className="ds-down">▼ 0.3%</i></div></div>
    <div className="ds-chart"><svg viewBox="0 0 240 100" role="img" aria-label="Orders per day, last 7 days: rising trend"><line className="axis" x1="0" y1="86" x2="240" y2="86" />{bars.map((h, i) => <rect key={i} className={`bar ${i === 6 ? "" : "dim"}`} x={10 + i * 32} y={86 - h} width="22" height={h} rx="3" />)}</svg><p className="mt-2 text-xs opacity-60">Sample data for layout only.</p></div>
  </div>);
}

const PREVIEWS: Record<GroupId, () => React.ReactNode> = { buttons: Buttons, inputs: Inputs, controls: Controls, navigation: Navigation, cards: Cards, data: Data, overlays: Overlays, feedback: Feedback, menus: Menus, forms: Forms, states: States, mobile: Mobile, ecommerce: Ecommerce, dashboard: Dashboard };

export function ComponentsTab({ project: p, direction: dir0 }: TabProps) {
  const [dirId, setDirId] = useState(dir0?.id ?? p.directions[0].id);
  const [dark, setDark] = useState(false);
  const [gid, setGid] = useState<GroupId>("buttons");
  const [code, setCode] = useState(false);
  const d = p.directions.find((x) => x.id === dirId) ?? p.directions[0];
  useGoogleFonts([d.fonts.heading, d.fonts.body], true);
  const ui = uiStyleOf(d);
  const c = dark ? darkTheme(d.palette.colors) : d.palette.colors;
  const sem = semanticColors(c.background);
  const group = GROUPS.find((g) => g.id === gid)!;
  const Preview = PREVIEWS[gid];
  const shadow = ui.shadow === "none" ? "none" : `${ui.shadow} ${c.text}33`;
  const vars = { "--color-primary": c.primary, "--color-secondary": c.secondary, "--color-accent": c.accent, "--color-background": c.background, "--color-surface": c.surface, "--color-text": c.text, "--color-border": c.border, "--color-success": sem.success, "--color-warning": sem.warning, "--color-danger": sem.danger, "--color-info": sem.info, "--color-on-primary": readableOn(c.primary), "--color-on-danger": readableOn(sem.danger), "--radius-base": `${ui.radius}px`, "--border-w": ui.border.split(" ")[0], "--shadow": shadow, "--font-heading": fontFamilyCss(d.fonts.heading), "--font-body": fontFamilyCss(d.fonts.body) } as React.CSSProperties;
  const css = useMemo(() => scopeCss(BASE_CSS + group.css, SCOPE), [group]);
  const snippet = groupSnippet(group);

  return (
    <div className="rise">
      <SectionHead title="UI components" desc="Live components styled with your direction's real colors, fonts, radius and borders. Use them as a starting point for your own screens." right={<><Chip active={!dark} onClick={() => setDark(false)}><Sun size={12} className="mr-1 inline" aria-hidden />Light</Chip><Chip active={dark} onClick={() => setDark(true)}><MoonStar size={12} className="mr-1 inline" aria-hidden />Dark (derived)</Chip></>} />
      <div className="mb-4 flex flex-wrap items-center gap-2"><span className="text-xs text-faint">Preview in direction</span>{p.directions.map((x) => <Chip key={x.id} active={x.id === d.id} onClick={() => setDirId(x.id)}>{x.name}</Chip>)}</div>
      <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Component categories" className="scroll-thin flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {GROUPS.map((g) => <button key={g.id} onClick={() => setGid(g.id)} aria-current={gid === g.id ? "true" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${gid === g.id ? "bg-hover text-fg" : "text-muted hover:bg-hover/60 hover:text-fg"}`}>{g.title}</button>)}
        </nav>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-base font-semibold">{group.title}</h3><p className="text-[13px] text-muted">{group.desc}</p></div><div className="flex flex-wrap gap-1.5"><Badge tone="accent">Interactive preview</Badge><Badge title="The code below is the same CSS the preview uses">Exportable HTML + CSS</Badge></div></div>
          <style>{css}</style>
          <div className="dp-stage relative overflow-hidden rounded-xl border border-line-strong" style={{ ...vars, background: c.background }}>
            <div className="ds p-4 sm:p-6" style={{ background: c.background }}><Preview /></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setCode(!code)} aria-expanded={code}>{code ? "Hide code" : "Show HTML + CSS"}</Button>
            <CopyButton text={snippet} label="Copy HTML + CSS" what="Component code" />
            <Button size="sm" onClick={() => download(`${d.name.toLowerCase().replace(/\W+/g, "-")}-components.css`, componentsCssFile({ ...p, selectedDirection: d.id }), "text/css")}>Download all component CSS</Button>
          </div>
          {code && <Card className="mt-3"><pre className="scroll-thin max-h-96 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-muted whitespace-pre-wrap">{snippet}</pre></Card>}
          <div className="mt-4"><Notice>Code is plain HTML + CSS that uses the token names from the Export tab (<code className="rounded bg-elevated px-1">--color-primary</code>, <code className="rounded bg-elevated px-1">--radius-base</code> …). It isn&rsquo;t generated for React, Vue or any framework, and sample content like product names is placeholder text.</Notice></div>
        </div>
      </div>
    </div>
  );
}
