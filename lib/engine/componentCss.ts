// Single source of truth for the component explorer: the SAME css powers the live preview (scoped under .dp-stage)
// and the copyable/downloadable snippet. It only uses the token names exported by the handoff (--color-*, --radius-base,
// --font-heading/--font-body, --border-w, --shadow), so pasting the snippet next to the exported tokens works as-is.

export type GroupId = "buttons" | "inputs" | "controls" | "navigation" | "cards" | "data" | "overlays" | "feedback" | "menus" | "forms" | "states" | "mobile" | "ecommerce" | "dashboard";

export interface Group { id: GroupId; title: string; desc: string; css: string; html: string }

const focus = "outline:2px solid var(--color-primary);outline-offset:2px";

export const BASE_CSS = `
.ds{font-family:var(--font-body);color:var(--color-text);box-sizing:border-box}
.ds *,.ds *::before,.ds *::after{box-sizing:inherit}
.ds-btn{font:inherit;font-weight:600;font-size:14px;line-height:1;padding:11px 18px;min-height:44px;border-radius:var(--radius-base);border:var(--border-w) solid transparent;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:background .15s,border-color .15s,transform .05s}
.ds-btn--primary{background:var(--color-primary);color:var(--color-on-primary)}
.ds-btn--primary:hover,.ds-btn--primary.is-hover{filter:brightness(1.1)}
.ds-btn--secondary{background:var(--color-surface);color:var(--color-text);border-color:var(--color-border)}
.ds-btn--secondary:hover,.ds-btn--secondary.is-hover{border-color:var(--color-primary)}
.ds-btn--ghost{background:transparent;color:var(--color-primary)}
.ds-btn--ghost:hover,.ds-btn--ghost.is-hover{background:color-mix(in srgb,var(--color-primary) 12%,transparent)}
.ds-btn--danger{background:var(--color-danger);color:var(--color-on-danger)}
.ds-btn:active{transform:translateY(1px)}
.ds-btn:focus-visible,.ds-btn.is-focus{${focus}}
.ds-btn:disabled,.ds-btn.is-disabled{opacity:.5;cursor:not-allowed}
.ds-btn.is-loading{position:relative;color:transparent;pointer-events:none}
.ds-btn.is-loading::after{content:"";position:absolute;inset:0;margin:auto;width:16px;height:16px;border-radius:50%;border:2px solid var(--color-on-primary);border-top-color:transparent;animation:ds-spin .7s linear infinite}
.ds-btn--secondary.is-loading::after{border-color:var(--color-text);border-top-color:transparent}
@keyframes ds-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ds-btn.is-loading::after{animation-duration:2s}}
`;

export const GROUPS: Group[] = [
  { id: "buttons", title: "Buttons & states", desc: "Primary, secondary, ghost and destructive buttons with hover, focus, disabled and loading states.",
    css: `/* uses the base .ds-btn rules */`,
    html: `<button class="ds-btn ds-btn--primary">Primary</button>
<button class="ds-btn ds-btn--secondary">Secondary</button>
<button class="ds-btn ds-btn--ghost">Ghost</button>
<button class="ds-btn ds-btn--danger">Delete</button>
<button class="ds-btn ds-btn--primary" disabled>Disabled</button>
<button class="ds-btn ds-btn--primary is-loading" aria-busy="true">Saving</button>` },
  { id: "inputs", title: "Text inputs & select", desc: "Text input, textarea, search bar and select, with focus, error and disabled states.",
    css: `.ds-field{display:grid;gap:6px;font-size:13px}
.ds-field label{font-weight:600}
.ds-input,.ds-select,.ds-textarea{font:inherit;font-size:15px;padding:10px 12px;min-height:44px;width:100%;background:var(--color-surface);color:var(--color-text);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base)}
.ds-textarea{min-height:88px;resize:vertical}
.ds-input::placeholder{color:color-mix(in srgb,var(--color-text) 50%,transparent)}
.ds-input:focus,.ds-select:focus,.ds-textarea:focus,.ds-input.is-focus{${focus};border-color:var(--color-primary)}
.ds-input.is-error{border-color:var(--color-danger)}
.ds-input:disabled{opacity:.5;cursor:not-allowed}
.ds-help{font-size:12px;opacity:.75}
.ds-error{font-size:12px;color:var(--color-danger)}
.ds-search{position:relative}
.ds-search .ds-input{padding-left:38px}
.ds-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.6}`,
    html: `<div class="ds-field"><label for="email">Email</label>
  <input id="email" class="ds-input" type="email" placeholder="you@example.com">
  <span class="ds-help">We'll never share it.</span></div>
<div class="ds-field"><label for="bad">Name</label>
  <input id="bad" class="ds-input is-error" aria-invalid="true" aria-describedby="bad-e">
  <span id="bad-e" class="ds-error">Please enter your name.</span></div>
<textarea class="ds-textarea" aria-label="Message"></textarea>
<select class="ds-select" aria-label="Plan"><option>Starter</option><option>Pro</option></select>` },
  { id: "controls", title: "Checkbox, radio, toggle & slider", desc: "Selection controls that work with keyboard and touch.",
    css: `.ds-check,.ds-radio{display:flex;align-items:center;gap:10px;min-height:44px;font-size:14px;cursor:pointer}
.ds-check input,.ds-radio input{width:20px;height:20px;accent-color:var(--color-primary)}
.ds-toggle{display:inline-flex;align-items:center;gap:10px;min-height:44px;font-size:14px;cursor:pointer}
.ds-toggle input{appearance:none;width:44px;height:26px;border-radius:99px;background:var(--color-border);position:relative;transition:background .15s;cursor:pointer;margin:0}
.ds-toggle input::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:var(--color-surface);transition:transform .15s;box-shadow:0 1px 2px #0004}
.ds-toggle input:checked{background:var(--color-primary)}
.ds-toggle input:checked::after{transform:translateX(18px)}
.ds-toggle input:focus-visible{${focus}}
.ds-range{width:100%;accent-color:var(--color-primary);min-height:32px}`,
    html: `<label class="ds-check"><input type="checkbox" checked> Email me updates</label>
<label class="ds-radio"><input type="radio" name="plan" checked> Monthly</label>
<label class="ds-toggle"><input type="checkbox" role="switch"> Dark mode</label>
<input class="ds-range" type="range" min="0" max="100" aria-label="Volume">` },
  { id: "navigation", title: "Navigation, tabs & breadcrumbs", desc: "Top bar, sidebar, tabs and breadcrumbs with a clear current-page state.",
    css: `.ds-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base)}
.ds-nav a,.ds-side a,.ds-crumbs a{color:inherit;text-decoration:none;padding:8px 10px;border-radius:calc(var(--radius-base) / 2);font-size:14px;display:inline-block}
.ds-nav a:hover,.ds-side a:hover{background:color-mix(in srgb,var(--color-primary) 10%,transparent)}
.ds-nav a[aria-current],.ds-side a[aria-current]{color:var(--color-primary);font-weight:600}
.ds-nav a:focus-visible,.ds-side a:focus-visible,.ds-tab:focus-visible{${focus}}
.ds-side{display:grid;gap:2px;padding:10px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);min-width:150px}
.ds-tabs{display:flex;gap:4px;border-bottom:1px solid var(--color-border);overflow-x:auto}
.ds-tab{font:inherit;font-size:14px;background:none;border:0;border-bottom:2px solid transparent;color:inherit;opacity:.7;padding:12px 14px;min-height:44px;cursor:pointer;white-space:nowrap}
.ds-tab[aria-selected=true]{opacity:1;color:var(--color-primary);border-bottom-color:var(--color-primary);font-weight:600}
.ds-crumbs{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:13px;opacity:.85}
.ds-crumbs span[aria-hidden]{opacity:.5}`,
    html: `<nav class="ds-nav" aria-label="Main"><b>Brand</b>
  <span><a href="#" aria-current="page">Home</a><a href="#">Shop</a><a href="#">About</a></span></nav>
<div role="tablist" class="ds-tabs"><button role="tab" aria-selected="true" class="ds-tab">Overview</button>
  <button role="tab" aria-selected="false" class="ds-tab">Details</button></div>
<nav class="ds-crumbs" aria-label="Breadcrumb"><a href="#">Home</a><span aria-hidden="true">/</span><a href="#">Shop</a><span aria-hidden="true">/</span><span aria-current="page">Serum</span></nav>` },
  { id: "cards", title: "Cards, panels & stats", desc: "Content cards, a panel with header and a statistic.",
    css: `.ds-card{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:16px;box-shadow:var(--shadow)}
.ds-card h3{font-family:var(--font-heading);margin:0 0 6px;font-size:18px}
.ds-card p{margin:0;font-size:14px;opacity:.8;line-height:1.5}
.ds-card--link{transition:border-color .15s,transform .15s;cursor:pointer}
.ds-card--link:hover{border-color:var(--color-primary);transform:translateY(-2px)}
.ds-stat b{display:block;font-family:var(--font-heading);font-size:30px;line-height:1.1;color:var(--color-primary)}
.ds-stat span{font-size:12px;opacity:.7}`,
    html: `<article class="ds-card ds-card--link"><h3>Barrier serum</h3><p>Three ingredients. Daily use.</p></article>
<div class="ds-card ds-stat"><b>12.4k</b><span>Orders this month</span></div>` },
  { id: "data", title: "Tables, lists & data display", desc: "A sortable table (scrolls inside its container on small screens) and a list.",
    css: `.ds-tablewrap{overflow-x:auto;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);background:var(--color-surface)}
.ds-table{width:100%;border-collapse:collapse;font-size:14px;min-width:420px}
.ds-table th,.ds-table td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--color-border)}
.ds-table th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;opacity:.7;font-weight:600}
.ds-table th button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-transform:inherit;letter-spacing:inherit;padding:0}
.ds-table tbody tr:hover{background:color-mix(in srgb,var(--color-primary) 6%,transparent)}
.ds-table tr:last-child td{border-bottom:0}
.ds-list{list-style:none;margin:0;padding:0;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);background:var(--color-surface)}
.ds-list li{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--color-border);font-size:14px}
.ds-list li:last-child{border-bottom:0}`,
    html: `<div class="ds-tablewrap"><table class="ds-table"><thead><tr><th scope="col">Order</th><th scope="col">Status</th><th scope="col">Total</th></tr></thead>
<tbody><tr><td>#1042</td><td>Shipped</td><td>$68</td></tr></tbody></table></div>
<ul class="ds-list"><li><span>Barrier serum</span><b>$38</b></li></ul>` },
  { id: "overlays", title: "Dialogs, drawers & popovers", desc: "Modal dialog, side drawer and popover. Previews open inside the stage.",
    css: `.ds-scrim{position:absolute;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;padding:16px;z-index:5}
.ds-dialog{background:var(--color-surface);color:var(--color-text);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:20px;max-width:360px;width:100%;box-shadow:0 20px 50px #0006}
.ds-dialog h3{font-family:var(--font-heading);margin:0 0 6px}
.ds-dialog p{margin:0 0 16px;font-size:14px;opacity:.8}
.ds-dialog .row{display:flex;justify-content:flex-end;gap:8px}
.ds-drawer{position:absolute;top:0;right:0;bottom:0;width:min(280px,85%);background:var(--color-surface);border-left:var(--border-w) solid var(--color-border);padding:18px;z-index:5;box-shadow:-12px 0 30px #0004}
.ds-popwrap{position:relative;display:inline-block}
.ds-popover{position:absolute;top:calc(100% + 8px);left:0;width:220px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:12px;font-size:13px;box-shadow:0 12px 30px #0004;z-index:4}`,
    html: `<div class="ds-scrim"><div role="dialog" aria-modal="true" aria-labelledby="t" class="ds-dialog">
  <h3 id="t">Delete project?</h3><p>This can't be undone.</p>
  <div class="row"><button class="ds-btn ds-btn--secondary">Cancel</button><button class="ds-btn ds-btn--danger">Delete</button></div></div></div>` },
  { id: "feedback", title: "Alerts, badges, tooltips & toasts", desc: "Status messages that never rely on color alone.",
    css: `.ds-alert{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:var(--radius-base);border:var(--border-w) solid currentColor;font-size:14px;background:color-mix(in srgb,currentColor 8%,var(--color-surface))}
.ds-alert b{display:block}
.ds-alert--success{color:var(--color-success)}.ds-alert--warning{color:var(--color-warning)}.ds-alert--danger{color:var(--color-danger)}.ds-alert--info{color:var(--color-info)}
.ds-alert p{margin:2px 0 0;color:var(--color-text);opacity:.85}
.ds-badge{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;padding:3px 9px;border-radius:99px;background:color-mix(in srgb,var(--color-primary) 14%,transparent);color:var(--color-primary)}
.ds-tipwrap{position:relative;display:inline-block}
.ds-tip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:var(--color-text);color:var(--color-background);font-size:12px;padding:5px 8px;border-radius:6px;white-space:nowrap}
.ds-toast{display:inline-flex;gap:10px;align-items:center;padding:10px 14px;background:var(--color-text);color:var(--color-background);border-radius:var(--radius-base);font-size:14px;box-shadow:0 10px 30px #0005}`,
    html: `<div class="ds-alert ds-alert--success" role="status"><span aria-hidden="true">✓</span><div><b>Saved</b><p>Your changes are live.</p></div></div>
<span class="ds-badge">New</span>
<div class="ds-toast" role="status">Added to cart</div>` },
  { id: "menus", title: "Dropdown & action menus", desc: "Keyboard-operable menu button (arrow keys, Escape).",
    css: `.ds-menuwrap{position:relative;display:inline-block}
.ds-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:180px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:6px;box-shadow:0 12px 30px #0004;z-index:4;display:grid;gap:2px}
.ds-menu [role=menuitem]{font:inherit;font-size:14px;text-align:left;background:none;border:0;color:var(--color-text);padding:10px 12px;border-radius:calc(var(--radius-base) / 2);cursor:pointer;min-height:40px}
.ds-menu [role=menuitem]:hover,.ds-menu [role=menuitem]:focus-visible{background:color-mix(in srgb,var(--color-primary) 12%,transparent);outline:none}
.ds-menu hr{border:0;border-top:1px solid var(--color-border);margin:4px 0;width:100%}`,
    html: `<div class="ds-menuwrap"><button class="ds-btn ds-btn--secondary" aria-haspopup="menu" aria-expanded="true">Actions ▾</button>
  <div class="ds-menu" role="menu"><button role="menuitem">Rename</button><button role="menuitem">Duplicate</button><hr><button role="menuitem">Delete</button></div></div>` },
  { id: "forms", title: "Forms & validation", desc: "A sign-up form with inline validation on blur and submit.",
    css: `.ds-form{display:grid;gap:14px;max-width:360px}
.ds-form .ds-btn{justify-self:start}`,
    html: `<form class="ds-form" novalidate>
  <div class="ds-field"><label for="n">Full name</label><input id="n" class="ds-input" required></div>
  <div class="ds-field"><label for="e">Email</label><input id="e" class="ds-input" type="email" required aria-describedby="e-err"><span id="e-err" class="ds-error" role="alert"></span></div>
  <label class="ds-check"><input type="checkbox" required> I agree to the terms</label>
  <button class="ds-btn ds-btn--primary">Create account</button></form>` },
  { id: "states", title: "Empty, loading & skeleton states", desc: "Every list and page needs these three states designed.",
    css: `.ds-empty{text-align:center;padding:28px 18px;border:var(--border-w) dashed var(--color-border);border-radius:var(--radius-base)}
.ds-empty h3{font-family:var(--font-heading);margin:8px 0 4px}
.ds-empty p{margin:0 0 14px;font-size:14px;opacity:.75}
.ds-skel{background:linear-gradient(90deg,var(--color-border),color-mix(in srgb,var(--color-border) 50%,var(--color-surface)),var(--color-border));background-size:200% 100%;animation:ds-shim 1.4s linear infinite;border-radius:calc(var(--radius-base) / 2)}
@keyframes ds-shim{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.ds-skel{animation:none}}`,
    html: `<div class="ds-empty"><h3>No orders yet</h3><p>When you place an order it will show up here.</p><button class="ds-btn ds-btn--primary">Browse the shop</button></div>
<div aria-busy="true" aria-label="Loading"><div class="ds-skel" style="height:16px;width:60%"></div><div class="ds-skel" style="height:12px;margin-top:8px"></div></div>` },
  { id: "mobile", title: "Mobile navigation patterns", desc: "Bottom tab bar and a hamburger drawer, shown in a phone frame.",
    css: `.ds-tabbar{display:grid;grid-template-columns:repeat(4,1fr);background:var(--color-surface);border-top:1px solid var(--color-border)}
.ds-tabbar button{font:inherit;font-size:11px;background:none;border:0;color:inherit;opacity:.65;padding:8px 0;min-height:56px;display:grid;gap:2px;justify-items:center;cursor:pointer}
.ds-tabbar button[aria-current]{opacity:1;color:var(--color-primary);font-weight:600}
.ds-tabbar button:focus-visible{${focus}}
.ds-appbar{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--color-border);background:var(--color-surface)}
.ds-iconbtn{font:inherit;min-width:44px;min-height:44px;border-radius:var(--radius-base);background:none;border:0;color:inherit;cursor:pointer;font-size:18px}
.ds-iconbtn:focus-visible{${focus}}`,
    html: `<nav class="ds-tabbar" aria-label="Primary"><button aria-current="page">Home</button><button>Search</button><button>Saved</button><button>Profile</button></nav>` },
  { id: "ecommerce", title: "E-commerce components", desc: "Product card, filters, price/plan card and checkout summary.",
    css: `.ds-product{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);overflow:hidden}
.ds-product .img{aspect-ratio:1;background:linear-gradient(135deg,var(--color-secondary),var(--color-accent));opacity:.85}
.ds-product .body{padding:12px;display:grid;gap:6px;font-size:14px}
.ds-product .name{font-family:var(--font-heading);font-size:16px}
.ds-price{font-weight:700}
.ds-chip{font:inherit;font-size:13px;padding:8px 12px;min-height:40px;border-radius:99px;border:1px solid var(--color-border);background:var(--color-surface);color:inherit;cursor:pointer}
.ds-chip[aria-pressed=true]{background:var(--color-primary);color:var(--color-on-primary);border-color:var(--color-primary)}
.ds-chip:focus-visible{${focus}}
.ds-plan{border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:18px;background:var(--color-surface);display:grid;gap:8px}
.ds-plan--hot{border-color:var(--color-primary);box-shadow:var(--shadow)}
.ds-plan .big{font-family:var(--font-heading);font-size:32px;line-height:1}
.ds-sum{display:grid;gap:8px;font-size:14px}
.ds-sum div{display:flex;justify-content:space-between}
.ds-sum .total{font-weight:700;border-top:1px solid var(--color-border);padding-top:8px}`,
    html: `<article class="ds-product"><div class="img"></div><div class="body"><span class="name">Barrier serum</span><span class="ds-price">$38</span>
  <button class="ds-btn ds-btn--primary">Add to cart</button></div></article>
<div role="group" aria-label="Filters"><button class="ds-chip" aria-pressed="true">All skin</button><button class="ds-chip" aria-pressed="false">Dry</button></div>
<div class="ds-sum"><div><span>Subtotal</span><span>$76</span></div><div class="total"><span>Total</span><span>$81</span></div></div>` },
  { id: "dashboard", title: "Dashboard components", desc: "KPIs, a chart, filters and a data table.",
    css: `.ds-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}
.ds-kpi{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:14px}
.ds-kpi span{font-size:12px;opacity:.7}
.ds-kpi b{display:block;font-family:var(--font-heading);font-size:26px}
.ds-kpi i{font-style:normal;font-size:12px;font-weight:600}
.ds-up{color:var(--color-success)}.ds-down{color:var(--color-danger)}
.ds-chart{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);padding:14px}
.ds-chart svg{width:100%;height:auto;display:block}
.ds-chart .bar{fill:var(--color-primary)}.ds-chart .bar.dim{fill:var(--color-secondary)}
.ds-chart .axis{stroke:var(--color-border)}`,
    html: `<div class="ds-kpis"><div class="ds-kpi"><span>Revenue</span><b>$24.8k</b><i class="ds-up">▲ 12%</i></div>
  <div class="ds-kpi"><span>Refunds</span><b>1.2%</b><i class="ds-down">▼ 0.3%</i></div></div>
<div class="ds-chart"><svg viewBox="0 0 240 90" role="img" aria-label="Weekly orders"><line class="axis" x1="0" y1="80" x2="240" y2="80"/><rect class="bar" x="10" y="40" width="22" height="40"/></svg></div>` },
];

/** Prefix every rule's selector so preview CSS can't leak into the app. Works because group CSS has no nested blocks except @keyframes/@media, which are passed through. */
export function scopeCss(css: string, scope: string): string {
  let out = "", depth = 0, buf = "", atRule = false;
  for (const ch of css) {
    if (ch === "{") {
      if (depth === 0) {
        const sel = buf.trim();
        if (sel.startsWith("@")) { atRule = true; out += sel + "{"; } else out += sel.split(",").map((s) => (s.trim().startsWith(".ds") ? `${scope} ${s.trim()}` : s.trim())).join(",") + "{";
        buf = "";
      } else if (atRule) {
        const sel = buf.trim();
        out += /^(from|to|\d+%)/.test(sel) ? sel + "{" : sel.split(",").map((s) => (s.trim().startsWith(".ds") ? `${scope} ${s.trim()}` : s.trim())).join(",") + "{";
        buf = "";
      }
      depth++;
    } else if (ch === "}") {
      depth--; out += buf + "}"; buf = "";
      if (depth === 0) atRule = false;
    } else buf += ch;
  }
  return out;
}

export function groupSnippet(g: Group): string {
  return `/* ${g.title} — requires the token CSS from the Export tab (--color-*, --radius-base, --font-*, --border-w, --shadow) */\n${BASE_CSS.trim()}\n${g.css.startsWith("/*") ? "" : g.css}\n\n<!-- Markup -->\n${g.html}`;
}
