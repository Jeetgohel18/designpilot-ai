"use client";
import type { CSSProperties } from "react";
import { fontFamilyCss } from "@/lib/fonts";
import { readableOn } from "@/lib/color";
import { darkTheme } from "@/lib/engine/palette";
import { uiStyleOf } from "@/lib/engine/uistyle";
import type { Direction } from "@/lib/types";

/**
 * A lightweight composition built from the direction's REAL palette, fonts and UI traits. It is an illustration of the
 * direction's character — never a screenshot of a website. Sizes use container-query units so it scales to any card width.
 */
export function DirectionPreview({ d, label = true }: { d: Direction; label?: boolean }) {
  const ui = uiStyleOf(d);
  const c = ui.layout === "dark" ? darkTheme(d.palette.colors) : d.palette.colors;
  const hf = fontFamilyCss(d.fonts.heading), bf = fontFamilyCss(d.fonts.body);
  const r = Math.min(ui.radius, 24);
  const onP = readableOn(c.primary), onA = readableOn(c.accent), onS = readableOn(c.secondary);
  const shadow = ui.shadow === "none" ? "none" : ui.shadow.includes("0 0 0") ? `${ui.shadow} ${c.border}` : `${ui.shadow} ${c.text}33`;
  const box: CSSProperties = { background: c.background, color: c.text, fontFamily: bf, containerType: "inline-size", borderRadius: 10 };
  const btn = (bg: string, fg: string, extra: CSSProperties = {}): CSSProperties => ({ background: bg, color: fg, borderRadius: Math.min(r, 999), padding: "1.6cqw 3.4cqw", fontSize: "3cqw", fontWeight: 600, display: "inline-block", boxShadow: shadow, ...extra });
  const line: CSSProperties = { border: `${ui.border.split(" ")[0]} ${ui.border.split(" ")[1] ?? "solid"} ${c.border}` };
  const nav = (center?: boolean) => (
    <div style={{ display: "flex", justifyContent: center ? "center" : "space-between", gap: "4cqw", alignItems: "center", fontSize: "2.6cqw", padding: "2.4cqw 4cqw", borderBottom: `1px solid ${c.border}` }}>
      <b style={{ fontFamily: hf, fontSize: "3.4cqw" }}>Brand</b>{!center && <span style={{ display: "flex", gap: "3cqw", opacity: 0.7 }}><span>Shop</span><span>About</span><span>Journal</span></span>}
    </div>
  );
  let body: React.ReactNode;
  switch (ui.layout) {
    case "editorial":
      body = (<div style={{ padding: "4cqw" }}><div style={{ borderTop: `0.8cqw solid ${c.text}`, paddingTop: "2cqw", display: "flex", justifyContent: "space-between", fontSize: "2.2cqw", textTransform: "uppercase", letterSpacing: "0.2em" }}><span>Issue 01</span><span>New season</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "3cqw", marginTop: "3cqw" }}><div><div style={{ fontFamily: hf, fontSize: "11cqw", lineHeight: 0.92, fontWeight: 800, letterSpacing: "-0.03em" }}>Bold<br />ideas.</div><div style={{ ...btn(c.primary, onP), marginTop: "3cqw" }}>Read more</div></div><div style={{ background: c.accent, color: onA, padding: "2.4cqw", fontSize: "2.4cqw", ...line }}><b style={{ fontFamily: hf, fontSize: "8cqw", display: "block", lineHeight: 1 }}>01</b>Featured story</div></div></div>);
      break;
    case "organic":
      body = (<div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "3cqw", padding: "4cqw", alignItems: "center" }}><div><div style={{ fontFamily: hf, fontSize: "7.4cqw", lineHeight: 1.05 }}>Grown with care.</div><p style={{ fontSize: "2.6cqw", opacity: 0.75, margin: "1.6cqw 0 2.6cqw" }}>Honest ingredients, soft textures.</p><span style={btn(c.primary, onP)}>Shop now</span></div><div style={{ position: "relative", aspectRatio: "1", background: c.secondary, borderRadius: "46% 54% 52% 48% / 55% 45% 55% 45%" }}><div style={{ position: "absolute", right: "6%", bottom: "8%", width: "30%", aspectRatio: "1", borderRadius: "50%", background: c.accent }} /></div></div>);
      break;
    case "blocks":
      body = (<div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2.4cqw", padding: "3cqw" }}><div style={{ background: c.primary, color: onP, borderRadius: r, padding: "3.4cqw", ...line, boxShadow: shadow }}><div style={{ fontFamily: hf, fontSize: "8cqw", lineHeight: 1 }}>Make it pop!</div><span style={{ ...btn(c.background, c.text), marginTop: "2.6cqw", border: `0.5cqw solid ${c.text}` }}>Let&rsquo;s go</span></div><div style={{ display: "grid", gap: "2.4cqw" }}><div style={{ background: c.accent, color: onA, borderRadius: r, padding: "2.4cqw", transform: "rotate(-3deg)", fontFamily: hf, fontSize: "5cqw", boxShadow: shadow }}>New!</div><div style={{ background: c.secondary, color: onS, borderRadius: r, padding: "2.4cqw", fontSize: "2.6cqw" }}>Fresh colors, friendly vibes</div></div></div>);
      break;
    case "bento":
      body = (<div style={{ padding: "3.4cqw" }}><div style={{ fontFamily: hf, fontSize: "6cqw", lineHeight: 1.1, maxWidth: "70%" }}>Ship faster with less noise.</div><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "auto auto", gap: "1.6cqw", marginTop: "2.6cqw", fontSize: "2.2cqw" }}><div style={{ gridRow: "span 2", background: c.surface, borderRadius: r, padding: "2cqw", ...line }}><code style={{ opacity: 0.6, fontSize: "2cqw" }}>01 / core</code><div style={{ marginTop: "1cqw", height: "8cqw", background: `linear-gradient(90deg, ${c.primary}, ${c.accent})`, borderRadius: r / 2 }} /></div>{["Fast", "Secure"].map((t) => <div key={t} style={{ background: c.surface, borderRadius: r, padding: "2cqw", ...line }}>{t}</div>)}<div style={{ background: c.primary, color: onP, borderRadius: r, padding: "2cqw" }}>Start free</div><div style={{ background: c.surface, borderRadius: r, padding: "2cqw", ...line }}>API</div></div></div>);
      break;
    case "soft":
      body = (<div style={{ padding: "4cqw" }}><div style={{ fontFamily: hf, fontSize: "6.6cqw", lineHeight: 1.1 }}>Feel better, one step at a time.</div><span style={{ ...btn(c.primary, onP), marginTop: "2.6cqw", padding: "2.4cqw 5cqw", fontSize: "3.2cqw" }}>Get started</span><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2cqw", marginTop: "3cqw" }}>{["Gentle", "Guided"].map((t) => <div key={t} style={{ background: c.surface, borderRadius: r, padding: "2.4cqw", boxShadow: shadow, ...line, fontSize: "2.6cqw" }}><div style={{ width: "5cqw", height: "5cqw", borderRadius: "50%", background: c.secondary, marginBottom: "1cqw" }} />{t}</div>)}</div></div>);
      break;
    case "split":
      body = (<div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "3cqw", padding: "4cqw", alignItems: "center" }}><div><div style={{ fontFamily: hf, fontSize: "6.4cqw", lineHeight: 1.1 }}>Trusted by teams worldwide.</div><div style={{ display: "flex", gap: "1.6cqw", marginTop: "2.6cqw" }}><span style={btn(c.primary, onP)}>Contact sales</span><span style={{ ...btn(c.surface, c.text, { boxShadow: "none" }), ...line }}>Learn more</span></div></div><div style={{ display: "grid", gap: "1.6cqw" }}>{[["99.9%", "uptime"], ["24/7", "support"]].map(([n, t]) => <div key={t} style={{ background: c.surface, borderRadius: r, padding: "2cqw", ...line }}><b style={{ fontFamily: hf, fontSize: "6cqw", color: c.primary }}>{n}</b><div style={{ fontSize: "2.2cqw", opacity: 0.7 }}>{t}</div></div>)}</div></div>);
      break;
    case "badge":
      body = (<div style={{ padding: "4cqw", display: "grid", gridTemplateColumns: "auto 1fr", gap: "3.4cqw", alignItems: "center" }}><div style={{ width: "22cqw", aspectRatio: "1", borderRadius: "50%", background: c.primary, color: onP, border: `0.7cqw dashed ${onP}`, outline: `0.8cqw solid ${c.primary}`, outlineOffset: "0.5cqw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: hf, fontSize: "3.6cqw", textAlign: "center", lineHeight: 1.05 }}>Small<br />batch<br />since ’19</div><div><div style={{ fontFamily: hf, fontSize: "7cqw", lineHeight: 1 }}>Made by hand.</div><span style={{ ...btn(c.accent, onA, { border: `0.5cqw solid ${c.text}` }), marginTop: "2.4cqw" }}>See the story</span></div></div>);
      break;
    case "dark":
      body = (<div style={{ padding: "4cqw", background: `radial-gradient(60% 80% at 80% 0%, ${c.primary}33, transparent)` }}><div style={{ fontFamily: hf, fontSize: "7.6cqw", lineHeight: 1.02, letterSpacing: "0.02em" }}>THE NEXT<br /><span style={{ color: c.accent }}>DIMENSION</span></div><div style={{ display: "flex", gap: "1.6cqw", marginTop: "3cqw" }}><span style={btn(c.primary, onP, { boxShadow: "none" })}>Enter</span><span style={{ ...btn("transparent", c.text, { boxShadow: "none" }), border: `1px solid ${c.border}` }}>Docs</span></div><div style={{ marginTop: "3cqw", display: "flex", gap: "1.6cqw", fontFamily: "ui-monospace, monospace", fontSize: "2cqw", opacity: 0.6 }}><span>v1.0</span><span>·</span><span>online</span></div></div>);
      break;
    case "ornate":
      body = (<div style={{ padding: "3cqw" }}><div style={{ border: `${ui.border}`, borderColor: c.primary, padding: "3.4cqw", textAlign: "center" }}><div style={{ fontSize: "2.2cqw", letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.7 }}>Established 1892</div><div style={{ fontFamily: hf, fontSize: "7cqw", lineHeight: 1.1, margin: "1.4cqw 0" }}>Timeless craft</div><div style={{ color: c.primary, fontSize: "3cqw" }}>— ❖ —</div><span style={{ ...btn(c.primary, onP, { boxShadow: "none" }), marginTop: "1.6cqw" }}>Discover</span></div></div>);
      break;
    default:
      body = (<div style={{ padding: "4cqw", textAlign: "center" }}><div style={{ width: "10cqw", height: 1, background: c.text, opacity: 0.4, margin: "1cqw auto 3cqw" }} /><div style={{ fontFamily: hf, fontSize: "8cqw", fontWeight: 300, lineHeight: 1.1, letterSpacing: "0.02em" }}>Quiet confidence</div><p style={{ fontSize: "2.4cqw", opacity: 0.65, margin: "2cqw 0 3cqw", letterSpacing: "0.08em", textTransform: "uppercase" }}>The collection</p><span style={{ ...btn("transparent", c.text, { boxShadow: "none" }), border: `1px solid ${c.text}`, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "2.2cqw" }}>Discover</span><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2cqw", marginTop: "4cqw" }}>{[0, 1, 2].map((i) => <div key={i} style={{ aspectRatio: "4/5", ...line, background: i === 1 ? c.secondary + "55" : c.surface }} />)}</div></div>);
  }
  return (
    <figure className="m-0">
      <div role="img" aria-label={`Illustrative composition for ${d.name} using its palette and fonts`} style={box} className="overflow-hidden border border-line-strong">
        {nav(ui.layout === "centered" || ui.layout === "ornate")}{body}
      </div>
      {label && <figcaption className="mt-1.5 text-[11px] text-faint">Illustrative composition from this direction&rsquo;s real colors and fonts — not a screenshot.</figcaption>}
    </figure>
  );
}
