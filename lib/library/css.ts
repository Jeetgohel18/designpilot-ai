// Component CSS, organised in blocks. Every rule reads design tokens (CSS variables) so the same CSS serves the live preview
// (scoped under .dp-stage), the customization controls, and the exported snippets. Responsive behavior uses @container queries
// on .ds (container-type: inline-size), so a component reacts to the width of its container, not the whole window.

const focus = "outline:2px solid var(--color-primary);outline-offset:2px";
const sp = (n: number) => `calc(${n}px * var(--sp))`;

export const TOKEN_DEFAULTS = `--sp:1;--weight-ui:600;--border-w:1px;--radius-base:10px;--shadow:none;`;

export const BLOCKS: Record<string, string> = {
base: `
.ds{font-family:var(--font-body);color:var(--color-text);font-size:14px;line-height:1.5;container-type:inline-size;--color-muted:color-mix(in srgb,var(--color-text) 64%,var(--color-background));--radius-sm:calc(var(--radius-base) * .6);--radius-lg:calc(var(--radius-base) * 1.5)}
.ds *,.ds *::before,.ds *::after{box-sizing:border-box}
.ds [hidden]{display:none!important}
.ds h1,.ds h2,.ds h3,.ds h4{font-family:var(--font-heading);margin:0;line-height:1.2}
.ds p{margin:0}
.ds-i{flex:none;display:inline-block;vertical-align:middle}
.ds-row{display:flex;flex-wrap:wrap;align-items:center;gap:${sp(12)}}
.ds-stack{display:grid;gap:${sp(14)}}
.ds-muted{color:var(--color-muted)}
.ds-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ds-label{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--color-muted)}`,

button: `
.ds-btn{font:inherit;font-weight:var(--weight-ui);font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 ${sp(20)};border-radius:var(--radius-base);border:var(--border-w) solid transparent;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,color .15s,transform .05s,box-shadow .15s;text-decoration:none}
.ds-btn--sm{min-height:36px;padding:0 ${sp(14)};font-size:13px}.ds-btn--lg{min-height:52px;padding:0 ${sp(26)};font-size:16px}
.ds-btn--primary{background:var(--color-primary);color:var(--color-on-primary);box-shadow:var(--shadow)}
.ds-btn--primary:hover,.ds-btn--primary.is-hover{background:color-mix(in srgb,var(--color-primary) 88%,var(--color-text))}
.ds-btn--secondary{background:var(--color-surface);color:var(--color-text);border-color:var(--color-border)}
.ds-btn--secondary:hover,.ds-btn--secondary.is-hover{border-color:var(--color-primary);color:var(--color-primary)}
.ds-btn--tertiary{background:color-mix(in srgb,var(--color-primary) 12%,transparent);color:var(--color-primary)}
.ds-btn--tertiary:hover,.ds-btn--tertiary.is-hover{background:color-mix(in srgb,var(--color-primary) 20%,transparent)}
.ds-btn--ghost{background:transparent;color:var(--color-text)}
.ds-btn--ghost:hover,.ds-btn--ghost.is-hover{background:color-mix(in srgb,var(--color-text) 8%,transparent)}
.ds-btn--danger{background:var(--color-danger);color:var(--color-on-danger)}
.ds-btn--danger:hover,.ds-btn--danger.is-hover{background:color-mix(in srgb,var(--color-danger) 85%,var(--color-text))}
.ds-btn:active,.ds-btn.is-active{transform:translateY(1px)}
.ds-btn:focus-visible,.ds-btn.is-focus{${focus}}
.ds-btn:disabled,.ds-btn.is-disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.ds-btn.is-loading{position:relative;color:transparent!important;pointer-events:none}
.ds-btn.is-loading .ds-i{opacity:0}
.ds-btn.is-loading::after{content:"";position:absolute;inset:0;margin:auto;width:16px;height:16px;border-radius:50%;border:2px solid var(--spin,var(--color-on-primary));border-top-color:transparent;animation:ds-spin .7s linear infinite}
.ds-btn--secondary.is-loading,.ds-btn--ghost.is-loading,.ds-btn--tertiary.is-loading{--spin:var(--color-primary)}
.ds-btn--success{background:var(--color-success);color:var(--color-on-success)}
.ds-iconbtn{min-width:44px;padding:0;border-radius:var(--radius-base)}.ds-iconbtn.ds-btn--sm{min-width:36px}.ds-iconbtn.ds-btn--lg{min-width:52px}
@keyframes ds-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ds-btn.is-loading::after{animation-duration:2.5s}}
.ds-group{display:inline-flex}
.ds-group .ds-btn{border-radius:0;margin-left:calc(var(--border-w) * -1)}
.ds-group .ds-btn:first-child{border-radius:var(--radius-base) 0 0 var(--radius-base);margin-left:0}
.ds-group .ds-btn:last-child{border-radius:0 var(--radius-base) var(--radius-base) 0}
.ds-group .ds-btn:hover,.ds-group .ds-btn:focus-visible{z-index:1;position:relative}
.ds-seg{display:inline-flex;padding:3px;gap:2px;background:color-mix(in srgb,var(--color-text) 7%,var(--color-surface));border-radius:calc(var(--radius-base) + 3px)}
.ds-seg button{font:inherit;font-weight:var(--weight-ui);font-size:13px;min-height:38px;padding:0 ${sp(16)};border:0;border-radius:var(--radius-base);background:transparent;color:var(--color-muted);cursor:pointer}
.ds-seg button[aria-pressed=true]{background:var(--color-surface);color:var(--color-text);box-shadow:0 1px 3px #0003}
.ds-seg button:focus-visible{${focus}}`,

field: `
.ds-field{display:grid;gap:6px;font-size:13px}
.ds-field>label,.ds-field>.ds-lbl{font-weight:600;font-size:13px;display:flex;gap:4px;align-items:center}
.ds-req{color:var(--color-danger)}
.ds-input,.ds-select,.ds-textarea{font:inherit;font-size:15px;width:100%;min-height:44px;padding:0 ${sp(14)};background:var(--color-surface);color:var(--color-text);border:var(--border-w) solid color-mix(in srgb,var(--color-text) 28%,var(--color-border));border-radius:var(--radius-base);transition:border-color .15s,box-shadow .15s}
.ds-textarea{padding:${sp(12)} ${sp(14)};min-height:96px;resize:vertical;line-height:1.5}
.ds-input::placeholder,.ds-textarea::placeholder{color:color-mix(in srgb,var(--color-text) 45%,transparent)}
.ds-input:hover,.ds-select:hover,.ds-textarea:hover{border-color:color-mix(in srgb,var(--color-text) 50%,var(--color-border))}
.ds-input:focus,.ds-select:focus,.ds-textarea:focus,.ds-input.is-focus{${focus};outline-offset:0;border-color:var(--color-primary)}
.ds-input.is-error,.ds-textarea.is-error,.ds-select.is-error{border-color:var(--color-danger)}
.ds-input.is-success{border-color:var(--color-success)}
.ds-input:disabled,.ds-select:disabled,.ds-textarea:disabled{opacity:.5;cursor:not-allowed;background:color-mix(in srgb,var(--color-text) 5%,var(--color-surface))}
.ds-input--sm{min-height:36px;font-size:13px}.ds-input--lg{min-height:52px;font-size:16px}
.ds-help{font-size:12px;color:var(--color-muted)}
.ds-error{font-size:12px;color:var(--color-danger);display:flex;gap:6px;align-items:center;min-height:16px}
.ds-ok{font-size:12px;color:var(--color-success)}
.ds-inwrap{position:relative;display:flex;align-items:center}
.ds-inwrap .ds-lead{position:absolute;left:14px;color:var(--color-muted);display:flex}
.ds-inwrap .ds-input.has-lead{padding-left:42px}
.ds-inwrap .ds-trail{position:absolute;right:4px;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center;background:none;border:0;border-radius:var(--radius-sm);color:var(--color-muted);cursor:pointer}
.ds-inwrap .ds-trail:hover{color:var(--color-text)}.ds-inwrap .ds-trail:focus-visible{${focus}}
.ds-select{appearance:none;padding-right:40px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center}
.ds-combo{position:relative}
.ds-listbox{position:absolute;z-index:5;top:calc(100% + 6px);left:0;right:0;max-height:210px;overflow:auto;list-style:none;margin:0;padding:6px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);box-shadow:0 14px 34px #0005}
.ds-listbox li{padding:10px 12px;border-radius:var(--radius-sm);cursor:pointer;display:flex;justify-content:space-between;gap:8px}
.ds-listbox li:hover,.ds-listbox li[aria-selected=true]{background:color-mix(in srgb,var(--color-primary) 14%,transparent)}
.ds-listbox li small{color:var(--color-muted)}
.ds-form{display:grid;gap:${sp(16)};max-width:420px}
.ds-date{position:relative}
.ds-cal{position:absolute;z-index:5;top:calc(100% + 6px);left:0;width:290px;padding:12px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);box-shadow:0 14px 34px #0005}
.ds-cal header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:600}
.ds-cal .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:13px}
.ds-cal .dow{color:var(--color-muted);font-size:11px;padding:6px 0}
.ds-cal button{font:inherit;min-height:36px;border:0;border-radius:var(--radius-sm);background:none;color:inherit;cursor:pointer}
.ds-cal button:hover{background:color-mix(in srgb,var(--color-primary) 14%,transparent)}
.ds-cal button[aria-pressed=true]{background:var(--color-primary);color:var(--color-on-primary)}
.ds-cal button:focus-visible{${focus}}`,

control: `
.ds-check,.ds-radio{display:flex;align-items:flex-start;gap:10px;min-height:32px;font-size:14px;cursor:pointer;padding:6px 0}
.ds-check input,.ds-radio input{appearance:none;flex:none;width:20px;height:20px;margin:1px 0 0;border:var(--border-w) solid color-mix(in srgb,var(--color-text) 40%,var(--color-border));background:var(--color-surface);display:grid;place-content:center;cursor:pointer;transition:background .12s,border-color .12s}
.ds-check input{border-radius:calc(var(--radius-base) * .4)}.ds-radio input{border-radius:50%}
.ds-check input::after{content:"";width:10px;height:6px;border-left:2px solid var(--color-on-primary);border-bottom:2px solid var(--color-on-primary);transform:rotate(-45deg) translate(1px,-1px) scale(0)}
.ds-radio input::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--color-on-primary);transform:scale(0)}
.ds-check input:checked,.ds-radio input:checked{background:var(--color-primary);border-color:var(--color-primary)}
.ds-check input:checked::after{transform:rotate(-45deg) translate(1px,-1px) scale(1)}.ds-radio input:checked::after{transform:scale(1)}
.ds-check input:indeterminate{background:var(--color-primary);border-color:var(--color-primary)}
.ds-check input:indeterminate::after{width:10px;height:0;border-left:0;border-bottom:2px solid var(--color-on-primary);transform:scale(1)}
.ds-check input:focus-visible,.ds-radio input:focus-visible,.ds-toggle input:focus-visible{${focus}}
.ds-check input:disabled,.ds-radio input:disabled,.ds-toggle input:disabled{opacity:.45;cursor:not-allowed}
.ds-check small,.ds-radio small{display:block;color:var(--color-muted);font-size:12px}
.ds-toggle{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px;font-size:14px;cursor:pointer}
.ds-toggle input{appearance:none;flex:none;width:46px;height:26px;border-radius:99px;background:color-mix(in srgb,var(--color-text) 22%,var(--color-border));position:relative;cursor:pointer;margin:0;transition:background .15s}
.ds-toggle input::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0005;transition:transform .15s}
.ds-toggle input:checked{background:var(--color-primary)}.ds-toggle input:checked::after{transform:translateX(20px)}
.ds-range{width:100%;accent-color:var(--color-primary);min-height:32px;cursor:pointer}
.ds-rangewrap{display:grid;gap:4px}.ds-rangewrap .top{display:flex;justify-content:space-between;font-size:13px}.ds-rangewrap output{font-weight:600;color:var(--color-primary)}
.ds-fieldset{border:0;padding:0;margin:0;display:grid;gap:2px}
.ds-fieldset legend{font-weight:600;font-size:13px;padding:0;margin-bottom:6px}`,

nav: `
.ds-nav{display:flex;align-items:center;justify-content:space-between;gap:${sp(16)};padding:${sp(10)} ${sp(16)};background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base)}
.ds-logo{display:inline-flex;align-items:center}.ds-logo svg{height:26px;width:auto;display:block}
.ds-nav .brand{font-family:var(--font-heading);font-weight:700;font-size:17px;display:flex;align-items:center;gap:8px;color:var(--color-text);text-decoration:none}
.ds-nav .brand b{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:calc(var(--radius-base) * .6);background:var(--color-primary);color:var(--color-on-primary);font-size:14px}
.ds-nav ul{list-style:none;margin:0;padding:0;display:flex;gap:4px}
.ds-nav a,.ds-side a,.ds-crumbs a{color:var(--color-muted);text-decoration:none;font-weight:500;padding:0 ${sp(12)};min-height:40px;display:inline-flex;align-items:center;gap:8px;border-radius:var(--radius-sm)}
.ds-nav a:hover,.ds-side a:hover{background:color-mix(in srgb,var(--color-primary) 10%,transparent);color:var(--color-text)}
.ds-nav a[aria-current],.ds-side a[aria-current]{color:var(--color-primary);font-weight:700}
.ds-nav a:focus-visible,.ds-side a:focus-visible,.ds-crumbs a:focus-visible,.ds-tab:focus-visible,.ds-pg button:focus-visible{${focus}}
.ds-nav .end{display:flex;align-items:center;gap:8px}
.ds-nav .burger{display:none}
@container (max-width:560px){.ds-nav ul,.ds-nav .end .ds-btn--secondary{display:none}.ds-nav .burger{display:inline-flex}}
.ds-side{display:grid;gap:2px;padding:${sp(12)};background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);min-width:200px;align-content:start}
.ds-side .grp{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-muted);padding:10px 12px 4px}
.ds-side a .count{margin-left:auto;font-size:11px;background:color-mix(in srgb,var(--color-primary) 16%,transparent);color:var(--color-primary);border-radius:99px;padding:1px 8px}
.ds-tabs{display:flex;gap:2px;border-bottom:var(--border-w) solid var(--color-border);overflow-x:auto}
.ds-tab{font:inherit;font-weight:var(--weight-ui);font-size:14px;background:none;border:0;border-bottom:2px solid transparent;margin-bottom:calc(var(--border-w) * -1);color:var(--color-muted);padding:0 ${sp(16)};min-height:44px;cursor:pointer;white-space:nowrap}
.ds-tab:hover{color:var(--color-text)}.ds-tab[aria-selected=true]{color:var(--color-primary);border-bottom-color:var(--color-primary)}
.ds-tabs--pill{border:0;gap:6px}.ds-tabs--pill .ds-tab{border:0;margin:0;border-radius:var(--radius-base);min-height:38px}
.ds-tabs--pill .ds-tab[aria-selected=true]{background:color-mix(in srgb,var(--color-primary) 14%,transparent)}
.ds-panel{padding:${sp(16)} 0}
.ds-crumbs{display:flex;flex-wrap:wrap;gap:2px;align-items:center;font-size:13px;color:var(--color-muted)}
.ds-crumbs a{min-height:32px;padding:0 6px}.ds-crumbs [aria-current]{color:var(--color-text);font-weight:600;padding:0 6px}
.ds-crumbs .sep{opacity:.5;display:inline-flex}
.ds-pg{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.ds-pg button{font:inherit;font-weight:var(--weight-ui);min-width:40px;min-height:40px;padding:0 10px;border-radius:var(--radius-sm);border:var(--border-w) solid transparent;background:none;color:var(--color-text);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.ds-pg button:hover:not(:disabled){background:color-mix(in srgb,var(--color-text) 8%,transparent)}
.ds-pg button[aria-current=page]{background:var(--color-primary);color:var(--color-on-primary)}
.ds-pg button:disabled{opacity:.4;cursor:not-allowed}.ds-pg .gap{padding:0 4px;color:var(--color-muted)}
.ds-pg .info{margin-left:auto;font-size:13px;color:var(--color-muted)}
.ds-cmd{width:100%;max-width:520px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);box-shadow:0 24px 60px #0006;overflow:hidden}
.ds-cmd .q{display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:var(--border-w) solid var(--color-border);color:var(--color-muted)}
.ds-cmd .q input{flex:1;font:inherit;font-size:15px;min-height:52px;background:none;border:0;color:var(--color-text);outline:none}
.ds-cmd .q kbd{font:inherit;font-size:11px;border:1px solid var(--color-border);border-radius:6px;padding:2px 6px}
.ds-cmd ul{list-style:none;margin:0;padding:8px;max-height:260px;overflow:auto}
.ds-cmd li.grp{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-muted);padding:8px 10px 4px}
.ds-cmd li.it{display:flex;align-items:center;gap:10px;padding:0 10px;min-height:42px;border-radius:var(--radius-sm);cursor:pointer}
.ds-cmd li.it:hover,.ds-cmd li.it.is-active{background:color-mix(in srgb,var(--color-primary) 14%,transparent)}
.ds-cmd li.it kbd{margin-left:auto;font:inherit;font-size:11px;color:var(--color-muted)}
.ds-tabbar{display:grid;grid-template-columns:repeat(4,1fr);background:var(--color-surface);border-top:var(--border-w) solid var(--color-border)}
.ds-tabbar a{display:grid;justify-items:center;gap:2px;padding:8px 0 10px;min-height:56px;font-size:11px;color:var(--color-muted);text-decoration:none;position:relative}
.ds-tabbar a[aria-current]{color:var(--color-primary);font-weight:700}
.ds-tabbar a .dot{position:absolute;top:8px;right:calc(50% - 16px);width:8px;height:8px;border-radius:50%;background:var(--color-danger)}
.ds-phone{width:100%;max-width:340px;min-height:420px;display:flex;flex-direction:column;border:6px solid color-mix(in srgb,var(--color-text) 25%,var(--color-border));border-radius:30px;overflow:hidden;background:var(--color-background);position:relative}
.ds-phone .screen{flex:1;padding:${sp(16)};display:grid;gap:${sp(12)};align-content:start}
.ds-appbar{display:flex;align-items:center;justify-content:space-between;padding:6px ${sp(10)};min-height:52px;background:var(--color-surface);border-bottom:var(--border-w) solid var(--color-border)}
.ds-appbar h3{font-size:16px}`,

card: `
.ds-card{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);padding:${sp(20)};box-shadow:var(--shadow);display:grid;gap:${sp(10)};align-content:start}
.ds-card h3{font-size:17px}.ds-card p{color:var(--color-muted)}
.ds-card--link{transition:border-color .15s,transform .15s}.ds-card--link:hover{border-color:var(--color-primary);transform:translateY(-2px)}
.ds-card .media{aspect-ratio:16/9;border-radius:var(--radius-base);background:linear-gradient(135deg,var(--color-secondary),var(--color-accent));margin:calc(var(--sp) * -4px) 0 0;opacity:.9}
.ds-grid{display:grid;gap:${sp(16)};grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.ds-kpi{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);padding:${sp(18)};display:grid;gap:4px;box-shadow:var(--shadow)}
.ds-kpi .lbl{font-size:12px;color:var(--color-muted);font-weight:600;display:flex;align-items:center;justify-content:space-between}
.ds-kpi .val{font-family:var(--font-heading);font-size:30px;line-height:1.1;font-weight:700}
.ds-kpi .delta{font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px}
.ds-up{color:var(--color-success)}.ds-down{color:var(--color-danger)}
.ds-spark{width:100%;height:36px;margin-top:6px}.ds-spark path{fill:none;stroke:var(--color-primary);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ds-avatar{--s:40px;width:var(--s);height:var(--s);border-radius:50%;display:inline-grid;place-items:center;font-weight:700;font-size:calc(var(--s) * .38);background:color-mix(in srgb,var(--color-primary) 18%,var(--color-surface));color:var(--color-primary);flex:none;position:relative;border:2px solid var(--color-surface)}
.ds-avatar--sq{border-radius:var(--radius-base)}.ds-avatar .st{position:absolute;right:-1px;bottom:-1px;width:28%;height:28%;border-radius:50%;background:var(--color-success);border:2px solid var(--color-surface)}
.ds-avatars{display:inline-flex}.ds-avatars .ds-avatar+.ds-avatar{margin-left:-10px}
.ds-profile{display:grid;gap:${sp(14)};text-align:center;justify-items:center}
.ds-profile h3{font-size:18px}.ds-profile .stats{display:flex;gap:${sp(24)};justify-content:center}.ds-profile .stats b{display:block;font-size:18px}.ds-profile .stats span{font-size:12px;color:var(--color-muted)}
.ds-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;line-height:1;padding:5px 10px;border-radius:99px;background:color-mix(in srgb,var(--color-primary) 14%,transparent);color:var(--color-primary)}
.ds-badge--success{background:color-mix(in srgb,var(--color-success) 16%,transparent);color:var(--color-success)}.ds-badge--warning{background:color-mix(in srgb,var(--color-warning) 18%,transparent);color:var(--color-warning)}
.ds-badge--danger{background:color-mix(in srgb,var(--color-danger) 16%,transparent);color:var(--color-danger)}.ds-badge--info{background:color-mix(in srgb,var(--color-info) 16%,transparent);color:var(--color-info)}
.ds-badge--neutral{background:color-mix(in srgb,var(--color-text) 9%,transparent);color:var(--color-muted)}.ds-badge--solid{background:var(--color-primary);color:var(--color-on-primary)}
.ds-dot{width:8px;height:8px;border-radius:50%;background:currentColor;flex:none}
.ds-tag{display:inline-flex;align-items:center;gap:6px;font-size:13px;min-height:30px;padding:0 6px 0 12px;border-radius:var(--radius-sm);background:color-mix(in srgb,var(--color-text) 8%,var(--color-surface));border:var(--border-w) solid var(--color-border)}
.ds-tag button{font:inherit;display:grid;place-items:center;width:22px;height:22px;border:0;border-radius:50%;background:none;color:var(--color-muted);cursor:pointer}.ds-tag button:hover{background:color-mix(in srgb,var(--color-text) 12%,transparent)}
.ds-chip{font:inherit;font-size:13px;font-weight:600;min-height:38px;padding:0 ${sp(14)};border-radius:99px;border:var(--border-w) solid var(--color-border);background:var(--color-surface);color:var(--color-text);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.ds-chip:hover{border-color:var(--color-primary)}.ds-chip[aria-pressed=true]{background:var(--color-primary);color:var(--color-on-primary);border-color:var(--color-primary)}.ds-chip:focus-visible{${focus}}
.ds-progress{height:8px;border-radius:99px;background:color-mix(in srgb,var(--color-text) 10%,var(--color-surface));overflow:hidden}
.ds-progress i{display:block;height:100%;border-radius:99px;background:var(--color-primary);transition:width .4s}
.ds-progress--success i{background:var(--color-success)}.ds-progress--warning i{background:var(--color-warning)}.ds-progress--danger i{background:var(--color-danger)}
.ds-prow{display:grid;gap:6px}.ds-prow .top{display:flex;justify-content:space-between;font-size:13px;font-weight:600}
.ds-steps{list-style:none;margin:0;padding:0;display:flex;gap:0;counter-reset:s}
.ds-steps li{flex:1;display:grid;justify-items:center;gap:6px;text-align:center;font-size:12px;color:var(--color-muted);position:relative}
.ds-steps li::before{counter-increment:s;content:counter(s);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:var(--color-surface);border:2px solid var(--color-border);z-index:1}
.ds-steps li::after{content:"";position:absolute;top:15px;left:calc(50% + 18px);right:calc(-50% + 18px);height:2px;background:var(--color-border)}
.ds-steps li:last-child::after{display:none}
.ds-steps li.done::before{content:"✓";background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary)}.ds-steps li.done::after{background:var(--color-primary)}
.ds-steps li.now::before{border-color:var(--color-primary);color:var(--color-primary)}.ds-steps li.now{color:var(--color-text);font-weight:700}
.ds-chart{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);padding:${sp(18)};box-shadow:var(--shadow)}
.ds-chart header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
.ds-chart svg{width:100%;height:auto;display:block}.ds-chart .bar{fill:var(--color-primary)}.ds-chart .bar.dim{fill:color-mix(in srgb,var(--color-primary) 35%,var(--color-surface))}
.ds-chart .axis{stroke:var(--color-border);stroke-width:1}.ds-chart .ln{fill:none;stroke:var(--color-primary);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.ds-chart .ar{fill:color-mix(in srgb,var(--color-primary) 16%,transparent)}.ds-chart text{fill:var(--color-muted);font-size:9px;font-family:var(--font-body)}
.ds-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--color-muted);margin-top:8px}.ds-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}
.ds-donut{width:120px;height:120px}.ds-donut circle{fill:none;stroke-width:14}`,

data: `
.ds-tablewrap{overflow-x:auto;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg)}
.ds-tbar{display:flex;gap:${sp(12)};align-items:center;justify-content:space-between;padding:${sp(12)} ${sp(16)};flex-wrap:wrap;border-bottom:var(--border-w) solid var(--color-border)}
.ds-table{width:100%;border-collapse:collapse;font-size:14px;min-width:520px}
.ds-table th,.ds-table td{text-align:left;padding:${sp(13)} ${sp(16)};border-bottom:var(--border-w) solid var(--color-border);white-space:nowrap}
.ds-table th{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--color-muted);font-weight:700;background:color-mix(in srgb,var(--color-text) 3%,var(--color-surface))}
.ds-table th button{font:inherit;color:inherit;letter-spacing:inherit;text-transform:inherit;background:none;border:0;padding:0;cursor:pointer;display:inline-flex;gap:4px;align-items:center;min-height:24px}
.ds-table th button:focus-visible{${focus}}
.ds-table td.num,.ds-table th.num{text-align:right;font-variant-numeric:tabular-nums}
.ds-table tbody tr:hover{background:color-mix(in srgb,var(--color-primary) 6%,transparent)}.ds-table tbody tr:last-child td{border-bottom:0}
.ds-table .who{display:flex;align-items:center;gap:10px}.ds-table .who .ds-avatar{--s:30px}
.ds-tfoot{display:flex;justify-content:space-between;align-items:center;padding:${sp(10)} ${sp(16)};border-top:var(--border-w) solid var(--color-border);font-size:13px;color:var(--color-muted);flex-wrap:wrap;gap:8px}
.ds-tempty{padding:${sp(40)} ${sp(16)};text-align:center;color:var(--color-muted)}
.ds-list{list-style:none;margin:0;padding:0;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden}
.ds-list li{display:flex;align-items:center;gap:${sp(12)};padding:${sp(14)} ${sp(16)};border-bottom:var(--border-w) solid var(--color-border)}.ds-list li:last-child{border-bottom:0}
.ds-list .grow{flex:1;min-width:0}.ds-list .grow b{display:block}.ds-list .grow span{font-size:12px;color:var(--color-muted)}
.ds-feed{list-style:none;margin:0;padding:0;display:grid;gap:0}
.ds-feed li{display:grid;grid-template-columns:auto 1fr;gap:${sp(12)};position:relative;padding-bottom:${sp(18)}}
.ds-feed li::before{content:"";position:absolute;left:15px;top:32px;bottom:2px;width:2px;background:var(--color-border)}.ds-feed li:last-child::before{display:none}
.ds-feed .ico{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--color-primary) 14%,transparent);color:var(--color-primary)}
.ds-feed b{font-weight:700}.ds-feed time{font-size:12px;color:var(--color-muted);display:block}
.ds-acc{display:grid;gap:0;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;background:var(--color-surface)}
.ds-acc details{border-bottom:var(--border-w) solid var(--color-border)}.ds-acc details:last-child{border-bottom:0}
.ds-acc summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;min-height:52px;padding:0 ${sp(18)};font-weight:600}
.ds-acc summary::-webkit-details-marker{display:none}.ds-acc summary:focus-visible{${focus};outline-offset:-2px}
.ds-acc details[open] summary .ds-i{transform:rotate(180deg)}.ds-acc .body{padding:0 ${sp(18)} ${sp(16)};color:var(--color-muted)}`,

feedback: `
.ds-alert{display:grid;grid-template-columns:auto 1fr auto;gap:${sp(12)};align-items:start;padding:${sp(14)} ${sp(16)};border-radius:var(--radius-base);border:var(--border-w) solid color-mix(in srgb,var(--tone) 45%,transparent);background:color-mix(in srgb,var(--tone) 10%,var(--color-surface));--tone:var(--color-info)}
.ds-alert--success{--tone:var(--color-success)}.ds-alert--warning{--tone:var(--color-warning)}.ds-alert--danger{--tone:var(--color-danger)}
.ds-alert .ic{color:var(--tone);display:flex;margin-top:1px}.ds-alert b{display:block}.ds-alert p{color:var(--color-muted);font-size:13px}
.ds-alert .x{background:none;border:0;color:var(--color-muted);cursor:pointer;min-width:32px;min-height:32px;border-radius:var(--radius-sm)}.ds-alert .x:focus-visible{${focus}}
.ds-alert .acts{display:flex;gap:12px;margin-top:6px;font-weight:700;font-size:13px}.ds-alert .acts a{color:var(--tone)}
.ds-toast{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 14px;background:var(--color-text);color:var(--color-background);border-radius:var(--radius-base);box-shadow:0 14px 34px #0006;max-width:380px;font-size:14px}
.ds-toast .ic{display:flex;color:var(--tone,var(--color-success))}.ds-toast button{font:inherit;font-weight:700;background:none;border:0;color:inherit;opacity:.85;cursor:pointer;min-height:32px;padding:0 6px;border-radius:6px;text-decoration:underline}
.ds-toasts{display:grid;gap:10px;justify-items:start}
.ds-tipwrap{position:relative;display:inline-flex}
.ds-tip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--color-text);color:var(--color-background);font-size:12px;font-weight:500;padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;pointer-events:none;z-index:6;opacity:0;visibility:hidden;transition:opacity .12s}
.ds-tipwrap:hover .ds-tip,.ds-tipwrap:focus-within .ds-tip,.ds-tip.is-shown{opacity:1;visibility:visible}
.ds-tip::after{content:"";position:absolute;top:100%;left:50%;margin-left:-5px;border:5px solid transparent;border-top-color:var(--color-text)}
.ds-popwrap{position:relative;display:inline-block}
.ds-popover{position:absolute;z-index:6;top:calc(100% + 8px);left:0;width:260px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);padding:${sp(16)};box-shadow:0 18px 44px #0005;display:grid;gap:8px}
.ds-popover h4{font-size:14px}.ds-popover p{font-size:13px;color:var(--color-muted)}
.ds-scrim{position:absolute;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px;z-index:20}
.ds-scrim--end{align-items:flex-end;padding:0}
.ds-dialog{background:var(--color-surface);color:var(--color-text);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);padding:${sp(24)};max-width:420px;width:100%;box-shadow:0 30px 70px #0007;display:grid;gap:${sp(10)}}
.ds-dialog h3{font-size:19px}.ds-dialog p{color:var(--color-muted)}.ds-dialog .row{display:flex;justify-content:flex-end;gap:8px;margin-top:${sp(10)};flex-wrap:wrap}
.ds-drawer{position:absolute;top:0;right:0;bottom:0;width:min(320px,88%);background:var(--color-surface);border-left:var(--border-w) solid var(--color-border);padding:${sp(20)};z-index:20;box-shadow:-18px 0 44px #0005;display:grid;gap:${sp(14)};align-content:start}
.ds-drawer header{display:flex;justify-content:space-between;align-items:center}
.ds-sheet{width:100%;background:var(--color-surface);border-radius:var(--radius-lg) var(--radius-lg) 0 0;padding:${sp(12)} ${sp(20)} ${sp(24)};display:grid;gap:${sp(12)};box-shadow:0 -18px 44px #0006}
.ds-sheet .grab{width:40px;height:4px;border-radius:4px;background:var(--color-border);justify-self:center}
.ds-spin{width:24px;height:24px;border-radius:50%;border:3px solid color-mix(in srgb,var(--color-primary) 22%,transparent);border-top-color:var(--color-primary);animation:ds-spin .8s linear infinite}
.ds-spin--lg{width:40px;height:40px;border-width:4px}
.ds-dots{display:inline-flex;gap:6px}.ds-dots i{width:8px;height:8px;border-radius:50%;background:var(--color-primary);animation:ds-bounce 1s infinite ease-in-out}.ds-dots i:nth-child(2){animation-delay:.15s}.ds-dots i:nth-child(3){animation-delay:.3s}
@keyframes ds-bounce{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
.ds-skel{background:linear-gradient(90deg,color-mix(in srgb,var(--color-text) 8%,var(--color-surface)),color-mix(in srgb,var(--color-text) 15%,var(--color-surface)),color-mix(in srgb,var(--color-text) 8%,var(--color-surface)));background-size:200% 100%;animation:ds-shim 1.4s linear infinite;border-radius:var(--radius-sm)}
@keyframes ds-shim{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.ds-skel,.ds-spin,.ds-dots i{animation-duration:3s}}
.ds-empty{text-align:center;padding:${sp(36)} ${sp(20)};border:var(--border-w) dashed var(--color-border);border-radius:var(--radius-lg);display:grid;gap:${sp(8)};justify-items:center}
.ds-empty .art{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--color-primary) 12%,transparent);color:var(--color-primary)}
.ds-empty h3{font-size:18px}.ds-empty p{color:var(--color-muted);max-width:34ch}
.ds-state{display:grid;justify-items:center;text-align:center;gap:10px;padding:${sp(24)}}
.ds-state .art{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}`,

product: `
.ds-plans{display:grid;gap:${sp(16)};grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch}
@container (max-width:680px){.ds-plans{grid-template-columns:1fr}}
.ds-plan{position:relative;display:grid;gap:${sp(12)};align-content:start;padding:${sp(24)};background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg)}
.ds-plan--hot{border:2px solid var(--color-primary);box-shadow:var(--shadow)}
.ds-plan .tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%)}
.ds-plan h3{font-size:18px}.ds-plan .price{font-family:var(--font-heading);font-size:38px;font-weight:700;line-height:1}.ds-plan .price small{font-size:14px;font-weight:500;color:var(--color-muted)}
.ds-plan ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:14px}.ds-plan li{display:flex;gap:8px;align-items:flex-start}.ds-plan li .ds-i{color:var(--color-success);margin-top:2px}
.ds-compare th[scope=row]{font-weight:600;text-transform:none;letter-spacing:0;font-size:14px;color:var(--color-text);background:none}
.ds-compare td,.ds-compare th{text-align:center}.ds-compare th:first-child,.ds-compare td:first-child{text-align:left}
.ds-compare .yes{color:var(--color-success)}.ds-compare .no{color:var(--color-muted);opacity:.6}
.ds-compare .hot{background:color-mix(in srgb,var(--color-primary) 7%,transparent)}
.ds-product{background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;display:grid;box-shadow:var(--shadow)}
.ds-product .img{aspect-ratio:1;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--color-accent) 55%,var(--color-surface)),var(--color-secondary));position:relative}
.ds-product .img .ds-badge{position:absolute;top:10px;left:10px}.ds-product .fav{position:absolute;top:8px;right:8px;width:38px;height:38px;border-radius:50%;border:0;background:var(--color-surface);color:var(--color-text);display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 8px #0003}
.ds-product .fav[aria-pressed=true]{color:var(--color-danger)}.ds-product .fav[aria-pressed=true] .ds-i{fill:currentColor}.ds-product .fav:focus-visible{${focus}}
.ds-product .body{padding:${sp(14)};display:grid;gap:6px}.ds-product .name{font-family:var(--font-heading);font-size:16px;font-weight:600}
.ds-product .meta{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--color-muted)}.ds-price{font-weight:700;color:var(--color-text);font-size:16px}.ds-price s{color:var(--color-muted);font-weight:400;font-size:13px;margin-left:6px}
.ds-stars{display:inline-flex;color:var(--color-warning);gap:1px}.ds-stars .ds-i{fill:currentColor}
.ds-cartrow{display:grid;grid-template-columns:64px 1fr auto;gap:${sp(14)};align-items:center;padding:${sp(14)} 0;border-bottom:var(--border-w) solid var(--color-border)}
.ds-cartrow .thumb{width:64px;height:64px;border-radius:var(--radius-base);background:linear-gradient(135deg,var(--color-secondary),var(--color-accent))}.ds-cartrow b{display:block}
.ds-qty{display:inline-flex;align-items:center;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);overflow:hidden}
.ds-qty button{font:inherit;width:36px;min-height:36px;border:0;background:none;color:inherit;cursor:pointer;font-size:16px}.ds-qty button:hover{background:color-mix(in srgb,var(--color-text) 8%,transparent)}.ds-qty button:focus-visible{${focus}}
.ds-qty output{min-width:30px;text-align:center;font-weight:700}
.ds-sum{display:grid;gap:10px;font-size:14px}.ds-sum div{display:flex;justify-content:space-between}.ds-sum .total{font-weight:700;font-size:17px;border-top:var(--border-w) solid var(--color-border);padding-top:12px}
.ds-cols{display:grid;gap:${sp(20)};grid-template-columns:1.4fr 1fr}
@container (max-width:640px){.ds-cols{grid-template-columns:1fr}}
.ds-auth{display:grid;grid-template-columns:1fr 1fr;min-height:420px;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;background:var(--color-surface)}
.ds-auth .art{background:linear-gradient(150deg,var(--color-primary),var(--color-accent));color:var(--color-on-primary);padding:${sp(32)};display:grid;align-content:end;gap:10px}.ds-auth .art h3{font-size:26px}
.ds-auth .form{padding:${sp(32)};display:grid;gap:${sp(14)};align-content:center}.ds-auth .or{display:flex;align-items:center;gap:10px;color:var(--color-muted);font-size:12px}.ds-auth .or::before,.ds-auth .or::after{content:"";flex:1;height:1px;background:var(--color-border)}
@container (max-width:620px){.ds-auth{grid-template-columns:1fr}.ds-auth .art{display:none}}
.ds-dash{display:grid;grid-template-columns:200px 1fr;gap:0;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;background:var(--color-background);min-height:420px}
.ds-dash aside{background:var(--color-surface);border-right:var(--border-w) solid var(--color-border);padding:${sp(14)};display:grid;gap:2px;align-content:start}
.ds-dash aside a{display:flex;align-items:center;gap:10px;min-height:40px;padding:0 12px;border-radius:var(--radius-sm);color:var(--color-muted);text-decoration:none;font-weight:500}.ds-dash aside a[aria-current]{background:color-mix(in srgb,var(--color-primary) 14%,transparent);color:var(--color-primary);font-weight:700}
.ds-dash main{padding:${sp(18)};display:grid;gap:${sp(16)};align-content:start;min-width:0}.ds-dash header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.ds-dash .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:${sp(12)}}
@container (max-width:700px){.ds-dash{grid-template-columns:1fr}.ds-dash aside{display:none}.ds-dash .kpis{grid-template-columns:1fr}}
.ds-filter{display:grid;gap:${sp(18)};padding:${sp(20)};background:var(--color-surface);border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);max-width:320px}
.ds-filter h4{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-muted);margin-bottom:6px;font-family:var(--font-body)}
.ds-filter .head{display:flex;justify-content:space-between;align-items:center}.ds-filter .head h3{font-size:17px}.ds-filter .head button{font:inherit;background:none;border:0;color:var(--color-primary);font-weight:700;cursor:pointer;min-height:32px}
.ds-onb{max-width:460px;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);padding:${sp(28)};display:grid;gap:${sp(16)}}
.ds-onb .art{height:140px;border-radius:var(--radius-base);background:linear-gradient(135deg,var(--color-secondary),var(--color-accent));display:grid;place-items:center;color:var(--color-on-primary)}
.ds-onb .dots{display:flex;gap:6px;justify-content:center}.ds-onb .dots i{width:8px;height:8px;border-radius:50%;background:var(--color-border)}.ds-onb .dots i.on{width:24px;border-radius:8px;background:var(--color-primary)}
.ds-onb .nav{display:flex;justify-content:space-between;gap:8px}
.ds-settings{display:grid;grid-template-columns:200px 1fr;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;background:var(--color-surface)}
.ds-settings nav{padding:${sp(14)};border-right:var(--border-w) solid var(--color-border);display:grid;gap:2px;align-content:start}
.ds-settings nav a{display:flex;align-items:center;gap:10px;min-height:40px;padding:0 12px;border-radius:var(--radius-sm);color:var(--color-muted);text-decoration:none;font-weight:500}.ds-settings nav a[aria-current]{background:color-mix(in srgb,var(--color-primary) 14%,transparent);color:var(--color-primary);font-weight:700}
.ds-settings .pane{padding:${sp(24)};display:grid;gap:${sp(18)};align-content:start}.ds-settings .rowset{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:${sp(12)} 0;border-bottom:var(--border-w) solid var(--color-border)}.ds-settings .rowset p{font-size:13px;color:var(--color-muted)}
@container (max-width:640px){.ds-settings{grid-template-columns:1fr}.ds-settings nav{border-right:0;border-bottom:var(--border-w) solid var(--color-border);display:flex;overflow-x:auto}}
.ds-results{display:grid;gap:${sp(14)}}.ds-result{display:grid;gap:4px;padding:${sp(14)} 0;border-bottom:var(--border-w) solid var(--color-border)}
.ds-result .url{font-size:12px;color:var(--color-success)}.ds-result a{font-family:var(--font-heading);font-size:17px;font-weight:600;color:var(--color-primary);text-decoration:none}.ds-result a:hover{text-decoration:underline}.ds-result mark{background:color-mix(in srgb,var(--color-warning) 35%,transparent);color:inherit;border-radius:3px}
.ds-drop{display:grid;justify-items:center;gap:8px;text-align:center;padding:${sp(32)} ${sp(20)};border:2px dashed color-mix(in srgb,var(--color-text) 30%,var(--color-border));border-radius:var(--radius-lg);background:color-mix(in srgb,var(--color-primary) 4%,var(--color-surface));cursor:pointer;transition:border-color .15s,background .15s}
.ds-drop:hover,.ds-drop.is-over{border-color:var(--color-primary);background:color-mix(in srgb,var(--color-primary) 10%,var(--color-surface))}.ds-drop:focus-within{${focus}}
.ds-drop .art{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--color-primary) 14%,transparent);color:var(--color-primary)}
.ds-files{list-style:none;margin:${sp(12)} 0 0;padding:0;display:grid;gap:8px}.ds-file{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);background:var(--color-surface)}.ds-file small{color:var(--color-muted)}`,
};

const FOUNDATION_CSS = `
.ds-swatch{border-radius:var(--radius-base);border:var(--border-w) solid var(--color-border);overflow:hidden;background:var(--color-surface)}
.ds-swatch i{display:block;height:64px}.ds-swatch div{padding:8px 10px;font-size:12px;display:grid;gap:2px}.ds-swatch b{font-size:13px}.ds-swatch code{color:var(--color-muted);font-size:11px}
.ds-specimen{display:grid;gap:4px;padding:10px 0;border-bottom:var(--border-w) solid var(--color-border)}.ds-specimen small{color:var(--color-muted);font-size:11px;font-family:ui-monospace,monospace}
.ds-space{display:flex;align-items:center;gap:12px;font-size:12px}.ds-space i{display:block;height:16px;background:var(--color-primary);border-radius:3px;opacity:.85}.ds-space code{width:64px;color:var(--color-muted)}
.ds-elev{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:${sp(18)}}.ds-elev div{height:84px;background:var(--color-surface);border:var(--border-w) solid var(--color-border);display:grid;place-items:center;font-size:12px;color:var(--color-muted)}
.ds-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px}.ds-icons div{display:grid;justify-items:center;gap:6px;padding:12px 4px;border:var(--border-w) solid var(--color-border);border-radius:var(--radius-base);background:var(--color-surface);font-size:11px;color:var(--color-muted)}
.ds-bp{display:grid;gap:10px}.ds-bp div{display:grid;grid-template-columns:90px 1fr;gap:12px;align-items:center;font-size:13px}.ds-bp i{display:block;height:14px;border-radius:4px;background:var(--color-primary);opacity:.85}
`;

BLOCKS.foundation = FOUNDATION_CSS;
