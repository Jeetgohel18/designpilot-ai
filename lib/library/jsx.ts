// Converts the library's own (controlled) HTML into a static React/TSX component. Only static markup is produced — no state or
// event handlers — and the result is verified by compiling every component with the TypeScript compiler in the test suite.
const VOID = new Set(["input", "br", "hr", "img", "meta", "link", "source", "wbr", "col"]);
const ATTR: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex", maxlength: "maxLength", readonly: "readOnly", autocomplete: "autoComplete", inputmode: "inputMode", viewbox: "viewBox", "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin", "stroke-dasharray": "strokeDasharray", "stroke-dashoffset": "strokeDashoffset", "text-anchor": "textAnchor", "fill-rule": "fillRule", "clip-rule": "clipRule", preserveaspectratio: "preserveAspectRatio", colspan: "colSpan", autofocus: "autoFocus", novalidate: "noValidate", spellcheck: "spellCheck", minlength: "minLength", datetime: "dateTime", rowspan: "rowSpan", enctype: "encType", crossorigin: "crossOrigin", accesskey: "accessKey" };
const NUMERIC = new Set(["tabIndex", "maxLength", "minLength", "colSpan", "rowSpan", "aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-level", "aria-posinset", "aria-setsize"]);
const BOOL = new Set(["disabled", "required", "multiple", "hidden", "readonly", "autofocus"]);
const DEFAULTED: Record<string, string> = { checked: "defaultChecked", selected: "defaultSelected", value: "defaultValue" };
const dec = (s: string) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");

function styleObj(css: string): string {
  const parts = css.split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(":"); const k = p.slice(0, i).trim(), v = dec(p.slice(i + 1).trim());
    const key = k.startsWith("--") ? JSON.stringify(k) : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return `${key}: ${JSON.stringify(/^-?\d+(\.\d+)?$/.test(v) && !k.includes("opacity") && !k.includes("line-height") && !k.includes("flex") && !k.includes("weight") ? v : v)}`;
  });
  const custom = css.includes("--");
  return custom ? `{{ ${parts.join(", ")} } as CSSProperties}` : `{{ ${parts.join(", ")} }}`;
}

function convertTag(tag: string): string {
  const m = /^<(\/?)([a-zA-Z][\w:-]*)([\s\S]*?)(\/?)>$/.exec(tag);
  if (!m) return tag;
  const [, close, name, rest, selfClose] = m;
  const lname = name.toLowerCase();
  if (close) return `</${name}>`;
  const attrs: string[] = [];
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g; let a: RegExpExecArray | null;
  while ((a = re.exec(rest))) {
    const raw = a[1]; const key = raw.toLowerCase(); const val = a[2] ?? a[3];
    if (key.startsWith("data-ds-") || key === "data-step" || key === "data-ds-price") continue; // behavior hooks are not part of static JSX
    if (key.startsWith("on")) continue;
    if (key === "style" && val !== undefined) { attrs.push(`style=${styleObj(val)}`); continue; }
    if (val === undefined) { attrs.push(BOOL.has(key) ? (ATTR[key] ?? key) : DEFAULTED[key] ?? (ATTR[key] ?? raw)); continue; }
    const jsxKey = DEFAULTED[key] && lname === "input" ? DEFAULTED[key] : ATTR[key] ?? (key.startsWith("aria-") || key.startsWith("data-") ? key : raw);
    attrs.push(NUMERIC.has(jsxKey) && /^-?\d+$/.test(val) ? `${jsxKey}={${val}}` : `${jsxKey}=${JSON.stringify(dec(val))}`);
  }
  const selfClosing = VOID.has(lname) || selfClose === "/" || ["path", "circle", "rect", "line", "polyline", "polygon", "stop"].includes(lname);
  return `<${name}${attrs.length ? " " + attrs.join(" ") : ""}${selfClosing ? " />" : ">"}`;
}

/** Strip comments, convert tags, and brace-escape literal { } in text. */
export function htmlToJsx(html: string): string {
  const out: string[] = []; const re = /<[^>]+>|[^<]+/g; let m: RegExpExecArray | null;
  const closedAsSelf: string[] = [];
  while ((m = re.exec(html))) {
    const tok = m[0];
    if (tok.startsWith("<!--")) continue;
    if (tok.startsWith("<")) {
      const name = /^<\/?([a-zA-Z][\w:-]*)/.exec(tok)?.[1]?.toLowerCase();
      const isClose = tok.startsWith("</");
      if (isClose && name && (VOID.has(name) || ["path", "circle", "rect", "line", "polyline", "polygon", "stop"].includes(name))) { closedAsSelf.push(name); continue; }
      out.push(convertTag(tok));
    } else out.push(tok.replace(/[{}]/g, (c) => `{'${c}'}`).replace(/&nbsp;/g, " "));
  }
  return out.join("");
}

const pascal = (id: string) => id.split(/[-_]/).map((s) => s[0].toUpperCase() + s.slice(1)).join("");

/** A complete .tsx file: a static presentational component. Pair it with the exported CSS. */
export function toTsx(id: string, name: string, html: string): string {
  const body = htmlToJsx(html.trim());
  const needsCss = body.includes("as CSSProperties");
  return `${needsCss ? 'import type { CSSProperties } from "react";\n\n' : ""}// ${name} — static markup generated by DesignPilot AI.\n// Interactive behavior (open/close, sorting, validation …) is NOT included; wire it up with your own state.\n// Requires the CSS exported with this component (class names start with "ds-").\nexport function ${pascal(id)}() {\n  return (\n    <div className="ds">\n${body.split("\n").map((l) => "      " + l).join("\n")}\n    </div>\n  );\n}\n`;
}
