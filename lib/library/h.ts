import { esc } from "../vector/ir";
import { icon } from "./icons";
import type { Cfg } from "./types";

export { esc, icon };
export const attrs = (o: Record<string, string | number | boolean | undefined>) => Object.entries(o).filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(String(v))}"`)).join("");

/** A button with optional leading/trailing icon, sized by cfg. */
export function btn(label: string, cfg: Partial<Cfg> = {}, o: { variant?: string; extra?: string; icon?: string; attrs?: Record<string, string | number | boolean | undefined> } = {}): string {
  const v = o.variant ?? cfg.variant ?? "primary", size = cfg.size ?? "md", pos = o.icon ? (cfg.iconPos && cfg.iconPos !== "none" ? cfg.iconPos : "none") : "none";
  const ic = o.icon ? icon(o.icon, size === "lg" ? 20 : 18) : "";
  const cls = `ds-btn ds-btn--${v === "destructive" ? "danger" : v}${size !== "md" ? ` ds-btn--${size}` : ""}${o.extra ? " " + o.extra : ""}`;
  const { type, ...rest } = o.attrs ?? {};
  return `<button type="${type ?? "button"}" class="${cls}"${attrs(rest)}>${pos === "left" ? ic : ""}${esc(label)}${pos === "right" ? ic : ""}</button>`;
}
export const field = (label: string, control: string, o: { help?: string; error?: string; ok?: string; required?: boolean; id?: string } = {}) =>
  `<div class="ds-field"><label${o.id ? ` for="${o.id}"` : ""}>${esc(label)}${o.required ? ' <span class="ds-req" aria-hidden="true">*</span>' : ""}</label>${control}${o.error ? `<span class="ds-error" id="${o.id}-e" role="alert">${icon("alert", 14)}${esc(o.error)}</span>` : o.ok ? `<span class="ds-ok">${esc(o.ok)}</span>` : o.help ? `<span class="ds-help" id="${o.id}-h">${esc(o.help)}</span>` : ""}</div>`;
export const initials = (s: string) => s.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
export const avatar = (name: string, o: { size?: number; status?: boolean; sq?: boolean } = {}) => `<span class="ds-avatar${o.sq ? " ds-avatar--sq" : ""}" style="--s:${o.size ?? 40}px" role="img" aria-label="${esc(name)}">${esc(initials(name))}${o.status ? '<span class="st"></span>' : ""}</span>`;
export const badge = (label: string, tone = "", dot = false) => `<span class="ds-badge${tone ? ` ds-badge--${tone}` : ""}">${dot ? '<span class="ds-dot"></span>' : ""}${esc(label)}</span>`;
