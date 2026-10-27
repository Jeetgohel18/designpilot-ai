/** Prefix every rule's selectors with `scope` so preview CSS can't leak into the app. Handles nested @media/@container/@supports; @keyframes pass through. */
export function scopeCss(css: string, scope: string): string {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "", i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open === -1) { out += src.slice(i); break; }
    const prelude = src.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < src.length && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
    const body = src.slice(open + 1, j - 1);
    if (/^@(media|container|supports|layer)/.test(prelude)) out += `${prelude}{${scopeCss(body, scope)}}`;
    else if (prelude.startsWith("@")) out += `${prelude}{${body}}`;
    else out += prelude.split(",").map((s) => { const t = s.trim(); return t.startsWith(".ds") ? `${scope} ${t}` : t; }).join(",") + `{${body}}`;
    i = j;
  }
  return out;
}
