import type { MoodItem } from "./types";

/** Only http(s) links are ever rendered as hrefs (blocks javascript: and data: URLs from shared snapshots). */
export const safeUrl = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:" ? x.toString() : null; } catch { return null; } };

export const itemSpan = (i: MoodItem) => (i.type === "type" || i.type === "note" ? "sm:col-span-2" : "");
