"use client";
import type { MoodItem } from "@/lib/types";
import { fontFamilyCss } from "@/lib/fonts";
import { readableOn } from "@/lib/color";
import { safeUrl } from "@/lib/mood";

export function MoodCard({ item }: { item: MoodItem }) {
  switch (item.type) {
    case "swatch":
      return <div className="flex h-full min-h-28 flex-col justify-end rounded-xl p-3" style={{ background: item.hex, color: readableOn(item.hex) }}><span className="text-xs font-medium capitalize">{item.label}</span><span className="font-mono text-[11px] opacity-80">{item.hex}</span></div>;
    case "type":
      return <div className="flex h-full min-h-28 flex-col justify-between rounded-xl border border-line bg-surface p-4"><p className="text-2xl leading-tight" style={{ fontFamily: fontFamilyCss(item.heading) }}>{item.sample}</p><p className="mt-3 text-xs text-muted" style={{ fontFamily: fontFamilyCss(item.body) }}>{item.heading} + {item.body}</p></div>;
    case "note":
      return <div className="h-full min-h-28 rounded-xl border border-line bg-elevated p-4 text-[13px] leading-relaxed text-muted whitespace-pre-wrap">{item.text}</div>;
    case "tag":
      return <div className="flex h-full min-h-28 flex-col justify-between rounded-xl border border-dashed border-line-strong p-4"><span className="text-[11px] uppercase tracking-wider text-faint">{item.group}</span><p className="text-sm leading-snug">{item.text}</p></div>;
    case "link": {
      const href = safeUrl(item.url);
      return <div className="flex h-full min-h-28 flex-col justify-between rounded-xl border border-line bg-surface p-4"><span className="text-[11px] uppercase tracking-wider text-faint">Reference · {item.source}</span>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm font-medium hover:text-accent">{item.title} ↗</a> : <span className="text-sm">{item.title}</span>}</div>;
    }
  }
}

