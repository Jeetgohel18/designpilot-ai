/* eslint-disable */
// Interaction layer for component previews AND exported HTML. It is ONE self-contained function (no imports, no outer
// references) so `attachBehaviors.toString()` can be shipped verbatim in the downloaded HTML file and behave identically.
// Everything is event-delegated and driven by data-ds-* attributes; it never touches anything outside `root`.
export function attachBehaviors(root: HTMLElement): () => void {
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  const scopeOf = (el: Element): HTMLElement => (el.closest("[data-ds-scope]") as HTMLElement) || root;
  const find = (el: Element, sel: string): HTMLElement | null => scopeOf(el).querySelector(sel);
  const hide = (el: HTMLElement | null, v: boolean) => { if (el) el.hidden = v; };
  const num = (s: string | null) => parseFloat((s || "").replace(/[^0-9.\-]/g, "")) || 0;

  root.querySelectorAll<HTMLInputElement>("[data-ds-indeterminate]").forEach((i) => { i.indeterminate = true; });

  function rebuildPagination(nav: HTMLElement, cur: number) {
    const total = Number(nav.dataset.dsTotal || 1);
    nav.querySelectorAll("[data-ds-page]:not([data-ds-page=prev]):not([data-ds-page=next]), .gap").forEach((n) => n.remove());
    const next = nav.querySelector<HTMLElement>("[data-ds-page=next]");
    const pages = Array.from(new Set([1, cur - 1, cur, cur + 1, total].filter((p) => p >= 1 && p <= total))).sort((a, b) => a - b);
    let prev = 0;
    pages.forEach((p) => {
      if (prev && p - prev > 1) { const g = document.createElement("span"); g.className = "gap"; g.setAttribute("aria-hidden", "true"); g.textContent = "…"; nav.insertBefore(g, next); }
      const b = document.createElement("button"); b.type = "button"; b.dataset.dsPage = String(p); b.textContent = String(p); if (p === cur) b.setAttribute("aria-current", "page");
      nav.insertBefore(b, next); prev = p;
    });
    nav.querySelector<HTMLButtonElement>("[data-ds-page=prev]")!.disabled = cur <= 1;
    if (next) (next as HTMLButtonElement).disabled = cur >= total;
    const info = nav.querySelector("[data-ds-pg-info]"); if (info) info.textContent = "Page " + cur + " of " + total;
  }

  function recalc(scope: HTMLElement) {
    let sum = 0;
    scope.querySelectorAll<HTMLElement>("[data-ds-price]").forEach((row) => { const q = num(row.querySelector("[data-ds-q]")!.textContent); const price = num(row.dataset.dsPrice!); sum += q * price; const line = row.querySelector("[data-ds-line]"); if (line) line.textContent = "$" + q * price; });
    const sub = scope.querySelector("[data-ds-subtotal]"); if (sub) sub.textContent = "$" + sum;
    const tot = scope.querySelector<HTMLElement>("[data-ds-total]"); if (tot) tot.textContent = "$" + (sum + num(tot.dataset.dsShip || "0"));
  }

  function validateField(el: HTMLInputElement): boolean {
    const err = el.closest(".ds-field")?.querySelector<HTMLElement>("[data-ds-err]") || (el.type === "checkbox" ? (el.closest("label")?.nextElementSibling as HTMLElement | null) : null);
    let msg = "";
    if (el.type === "checkbox") { if (el.required && !el.checked) msg = "You need to accept the terms to continue."; }
    else if (el.required && !el.value.trim()) msg = "This field is required.";
    else if (el.type === "email" && el.value && !/^\S+@\S+\.\S+$/.test(el.value)) msg = "Enter a valid email like name@example.com.";
    el.classList.toggle("is-error", !!msg); el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg;
    return !msg;
  }

  function listFiles(scope: HTMLElement, files: File[]) {
    const ul = scope.querySelector<HTMLElement>("[data-ds-filelist]"); if (!ul) return;
    ul.textContent = "";
    files.forEach((f, i) => {
      const li = document.createElement("li"); li.className = "ds-file";
      const ico = document.createElement("span"); ico.textContent = "📄"; ico.setAttribute("aria-hidden", "true");
      const d = document.createElement("div"); const b = document.createElement("b"); b.textContent = f.name; const sm = document.createElement("small"); sm.style.display = "block"; sm.textContent = (f.size / 1024 < 1024 ? Math.max(1, Math.round(f.size / 1024)) + " KB" : (f.size / 1048576).toFixed(1) + " MB") + " · ready to upload";
      d.append(b, sm);
      const rm = document.createElement("button"); rm.type = "button"; rm.className = "ds-btn ds-btn--ghost ds-iconbtn ds-btn--sm"; rm.setAttribute("aria-label", "Remove " + f.name); rm.textContent = "✕"; rm.onclick = () => { files.splice(i, 1); listFiles(scope, files); };
      li.append(ico, d, rm); ul.append(li);
    });
  }
  let chosen: File[] = [];

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement; if (!t || !t.closest) return;
    if (t.closest('a[href="#"]')) e.preventDefault();
    let el: HTMLElement | null;

    if ((el = t.closest("[data-ds-toggle]"))) { const tg = find(el, el.dataset.dsToggle!); if (tg) { tg.hidden = !tg.hidden; el.setAttribute("aria-expanded", String(!tg.hidden)); } return; }
    if ((el = t.closest("[data-ds-open]"))) { hide(find(el, el.dataset.dsOpen!), false); return; }
    if ((el = t.closest("[data-ds-close]"))) { hide(el.closest("[data-ds-layer]"), true); return; }
    if ((el = t.closest("[data-ds-dismiss]"))) { hide(el.closest("[data-ds-dismissable]"), true); return; }
    if ((el = t.closest("[data-ds-toast]"))) { const tg = find(el, el.dataset.dsToast!); if (tg) { tg.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { tg.hidden = true; }, 2800); } return; }
    if ((el = t.closest("[data-ds-segment] button"))) { el.parentElement!.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); return; }
    if ((el = t.closest("[data-ds-pressed]"))) { el.setAttribute("aria-pressed", String(el.getAttribute("aria-pressed") !== "true")); return; }
    if ((el = t.closest("[role=tab]"))) {
      const cont = el.closest("[data-ds-tabs]") as HTMLElement | null; if (!cont) return;
      const tabs = Array.from(cont.querySelectorAll(":scope > [role=tablist] > [role=tab]")); const panels = cont.querySelectorAll<HTMLElement>(":scope > [role=tabpanel]");
      const idx = tabs.indexOf(el); tabs.forEach((x, i) => x.setAttribute("aria-selected", String(i === idx))); panels.forEach((p, i) => { p.hidden = i !== idx; }); return;
    }
    if ((el = t.closest("[data-ds-pw]"))) { const input = el.closest(".ds-inwrap")!.querySelector("input")!; const show = input.type === "password"; input.type = show ? "text" : "password"; el.setAttribute("aria-pressed", String(show)); el.setAttribute("aria-label", show ? "Hide password" : "Show password"); return; }
    if ((el = t.closest("[data-ds-clear]"))) { const input = el.closest(".ds-inwrap")!.querySelector("input")!; input.value = ""; input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); return; }
    if ((el = t.closest("[data-ds-qty]"))) { const row = el.closest("[data-ds-price]") as HTMLElement; const out = row.querySelector("[data-ds-q]")!; out.textContent = String(Math.max(0, num(out.textContent) + Number(el.dataset.dsQty))); recalc(scopeOf(el)); return; }
    if ((el = t.closest("[data-ds-sort]"))) {
      const table = el.closest("table")!; const idx = Number(el.dataset.dsSort); const th = el.closest("th")!; const asc = th.getAttribute("aria-sort") !== "ascending";
      table.querySelectorAll("th").forEach((h) => h.removeAttribute("aria-sort")); th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      const body = table.tBodies[0]; const rows = Array.from(body.querySelectorAll<HTMLElement>("[data-ds-row]")); const isNum = el.hasAttribute("data-ds-num");
      rows.sort((a, b) => { const x = (a.children[idx] as HTMLElement).textContent!.trim(), y = (b.children[idx] as HTMLElement).textContent!.trim(); const c = isNum ? num(x) - num(y) : x.localeCompare(y); return asc ? c : -c; }).forEach((r) => body.appendChild(r)); return;
    }
    if ((el = t.closest("[data-ds-page]"))) {
      const nav = el.closest("[data-ds-pagination]") as HTMLElement; const cur = Number(nav.querySelector("[aria-current=page]")?.getAttribute("data-ds-page") || 1); const v = el.dataset.dsPage!;
      rebuildPagination(nav, v === "prev" ? cur - 1 : v === "next" ? cur + 1 : Number(v)); return;
    }
    if ((el = t.closest("[data-ds-day]"))) { const cal = el.closest(".ds-cal")!; cal.querySelectorAll("[data-ds-day]").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); const inp = scopeOf(el).querySelector<HTMLInputElement>("[data-ds-date-input]"); if (inp) inp.value = el.dataset.dsDay + " Jun 2026"; hide(cal as HTMLElement, true); return; }
    if ((el = t.closest("[data-ds-opt]"))) { const wrap = el.closest(".ds-combo")!; const inp = wrap.querySelector<HTMLInputElement>("input")!; inp.value = (el.firstChild as Text).textContent || ""; wrap.querySelectorAll("[data-ds-opt]").forEach((o) => o.setAttribute("aria-selected", String(o === el))); inp.setAttribute("aria-expanded", "false"); hide(wrap.querySelector("[data-ds-list]"), true); return; }
    if ((el = t.closest("[data-ds-cmdopt]"))) { el.parentElement!.querySelectorAll("[data-ds-cmdopt]").forEach((o) => o.classList.toggle("is-active", o === el)); return; }
    if ((el = t.closest("[data-ds-clearfilters]"))) { scopeOf(el).querySelectorAll<HTMLInputElement>("input[type=checkbox]").forEach((c) => { c.checked = false; }); return; }
    if ((el = t.closest("[data-ds-next], [data-ds-back], [data-ds-skip]"))) {
      const box = el.closest("[data-ds-onboarding]") as HTMLElement; const views = Array.from(box.querySelectorAll<HTMLElement>("[data-ds-stepview]")); let i = Number(box.dataset.step || 0);
      i = el.hasAttribute("data-ds-skip") ? views.length - 1 : el.hasAttribute("data-ds-next") ? Math.min(views.length - 1, i + 1) : Math.max(0, i - 1); box.dataset.step = String(i);
      views.forEach((v, n) => { v.hidden = n !== i; }); box.querySelectorAll(".dots i").forEach((d, n) => d.classList.toggle("on", n === i));
      const lab = box.querySelector("[data-ds-steplabel]"); if (lab) lab.textContent = "Step " + (i + 1) + " of " + views.length;
      (box.querySelector("[data-ds-back]") as HTMLButtonElement).disabled = i === 0; const nx = box.querySelector("[data-ds-next]") as HTMLElement; nx.firstChild!.textContent = i === views.length - 1 ? "Finish" : "Next"; return;
    }
    // click outside floating UI closes it
    root.querySelectorAll<HTMLElement>(".ds-popover, .ds-cal, .ds-listbox").forEach((f) => { if (!f.closest(".ds-popwrap, .ds-date, .ds-combo")?.contains(t)) f.hidden = true; });
  };

  const onInput = (e: Event) => {
    const t = e.target as HTMLInputElement; if (!t || !t.matches) return;
    if (t.matches("[data-ds-count]")) { const c = scopeOf(t).querySelector("[data-ds-counter]"); if (c) c.textContent = String(t.value.length); }
    if (t.matches("[data-ds-range]")) { const out = t.closest(".ds-rangewrap")!.querySelector("[data-ds-out]") as HTMLElement; out.textContent = (out.dataset.dsPrefix || "") + Number(t.value).toLocaleString("en-US") + (out.dataset.dsSuffix || ""); }
    if (t.matches("[data-ds-clearable]")) { const b = t.closest(".ds-inwrap")!.querySelector<HTMLElement>("[data-ds-clear]"); if (b) b.hidden = !t.value; }
    if (t.matches("[data-ds-strength]")) {
      const v = t.value; let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v) && v.length >= 10) s++;
      const wrap = t.closest(".ds-field")!; const bar = wrap.querySelector<HTMLElement>("[data-ds-bar]")!; const lab = wrap.querySelector("[data-ds-strength-label]")!; const meter = bar.parentElement!;
      const names = ["Too short", "Weak", "Okay", "Strong", "Very strong"]; bar.style.width = (v ? (s + 1) * 20 : 0) + "%"; meter.className = "ds-progress ds-progress--" + (s <= 1 ? "danger" : s === 2 ? "warning" : "success");
      lab.textContent = v ? "Password strength: " + names[v.length < 8 ? 0 : s] : "Use 8+ characters with a mix of letters and numbers.";
    }
    if (t.matches("[data-ds-filter]")) {
      const scope = scopeOf(t); const q = t.value.trim().toLowerCase(); let n = 0;
      scope.querySelectorAll<HTMLElement>("[data-ds-row]").forEach((r) => { const m = !q || (r.textContent || "").toLowerCase().includes(q); r.hidden = !m; if (m) n++; });
      const empty = scope.querySelector<HTMLElement>("[data-ds-empty]"); if (empty) empty.hidden = n > 0; const tb = scope.querySelector("table") as HTMLElement | null; if (tb) tb.hidden = n === 0;
      const c = scope.querySelector("[data-ds-count-rows]"); if (c) c.textContent = n + (n === 1 ? " person" : " people");
    }
    if (t.matches("[data-ds-combo]")) {
      const wrap = t.closest(".ds-combo")!; const list = wrap.querySelector<HTMLElement>("[data-ds-list]")!; const q = t.value.trim().toLowerCase(); let n = 0;
      list.hidden = false; t.setAttribute("aria-expanded", "true");
      wrap.querySelectorAll<HTMLElement>("[data-ds-opt]").forEach((o) => { const m = !q || (o.textContent || "").toLowerCase().includes(q); o.hidden = !m; if (m) n++; });
      const none = list.querySelector<HTMLElement>("[data-ds-none]"); if (none) none.hidden = n > 0;
    }
    if (t.matches("[data-ds-cmd-input]")) {
      const box = t.closest(".ds-cmd")!; const q = t.value.trim().toLowerCase(); let n = 0; let groupHead: HTMLElement | null = null; let groupHas = false;
      const closeGroup = () => { if (groupHead) groupHead.hidden = !groupHas; };
      box.querySelectorAll<HTMLElement>("li").forEach((li) => {
        if (li.hasAttribute("data-ds-cmdgrp")) { closeGroup(); groupHead = li; groupHas = false; }
        else if (li.hasAttribute("data-ds-cmdopt")) { const m = !q || (li.textContent || "").toLowerCase().includes(q); li.hidden = !m; if (m) { n++; groupHas = true; } }
      }); closeGroup();
      const none = box.querySelector<HTMLElement>("[data-ds-none]"); if (none) none.hidden = n > 0;
    }
  };

  const onChange = (e: Event) => { const t = e.target as HTMLInputElement; if (t && t.matches && t.matches("[data-ds-files]")) { chosen = chosen.concat(Array.from(t.files || [])); listFiles(scopeOf(t), chosen); t.value = ""; } };
  const onFocusIn = (e: Event) => { const t = e.target as HTMLInputElement; if (t && t.matches && t.matches("[data-ds-combo]")) onInput(e); };
  const onFocusOut = (e: Event) => { const t = e.target as HTMLInputElement; if (t && t.matches && t.closest("form[data-ds-validate]") && t.matches("input")) validateField(t); };
  const onSubmit = (e: Event) => {
    e.preventDefault(); const f = e.target as HTMLFormElement; if (!f.matches("form[data-ds-validate]")) return;
    let ok = true; let first: HTMLInputElement | null = null;
    f.querySelectorAll<HTMLInputElement>("input").forEach((i) => { if (!validateField(i)) { ok = false; first = first || i; } });
    const success = f.querySelector<HTMLElement>("[data-ds-success]"); if (success) success.hidden = !ok; if (first) (first as HTMLInputElement).focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (e.key === "Escape") { const layer = (t.closest && (t.closest("[data-ds-layer]") as HTMLElement)) || null; if (layer && !layer.classList.contains("ds-toast")) { layer.hidden = true; return; } scopeOf(t).querySelectorAll<HTMLElement>(".ds-popover, .ds-cal, .ds-listbox, .ds-scrim, .ds-drawer").forEach((x) => { x.hidden = true; }); }
    const menu = t.closest && (t.closest("[data-ds-menu]") as HTMLElement | null);
    if (menu && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); const items = Array.from(menu.querySelectorAll<HTMLElement>("[role=menuitem]")); const i = items.indexOf(document.activeElement as HTMLElement); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); }
    if (menu && e.key === "Enter" && (t as HTMLElement).getAttribute("role") === "menuitem") (t as HTMLElement).click();
    const tab = t.closest && (t.closest("[role=tab]") as HTMLElement | null);
    if (tab && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { const tabs = Array.from(tab.parentElement!.querySelectorAll<HTMLElement>("[role=tab]")); const n = tabs[(tabs.indexOf(tab) + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); }
  };
  const onDrag = (e: DragEvent) => { const z = (e.target as HTMLElement).closest && ((e.target as HTMLElement).closest("[data-ds-drop]") as HTMLElement | null); if (!z) return; e.preventDefault(); z.classList.toggle("is-over", e.type === "dragover"); if (e.type === "drop") { chosen = chosen.concat(Array.from(e.dataTransfer ? e.dataTransfer.files : [])); listFiles(scopeOf(z), chosen); } };

  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onChange);
  root.addEventListener("focusin", onFocusIn); root.addEventListener("focusout", onFocusOut); root.addEventListener("submit", onSubmit); root.addEventListener("keydown", onKey);
  root.addEventListener("dragover", onDrag); root.addEventListener("dragleave", onDrag); root.addEventListener("drop", onDrag);
  return () => {
    root.removeEventListener("click", onClick); root.removeEventListener("input", onInput); root.removeEventListener("change", onChange);
    root.removeEventListener("focusin", onFocusIn); root.removeEventListener("focusout", onFocusOut); root.removeEventListener("submit", onSubmit); root.removeEventListener("keydown", onKey);
    root.removeEventListener("dragover", onDrag); root.removeEventListener("dragleave", onDrag); root.removeEventListener("drop", onDrag);
    clearTimeout(toastTimer);
  };
}
