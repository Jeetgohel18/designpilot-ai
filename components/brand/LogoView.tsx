"use client";
import { useMemo } from "react";
import { toSvg, type Vec } from "@/lib/vector/ir";
import { outlineScene } from "@/lib/vector/text";
import { renderLogo, NO_FONTS, type Fonts } from "@/lib/brand/render";
import { Skeleton } from "../ui";
import { useBrandFonts } from "./useBrand";
import type { ConceptSpec, Layout, Scheme } from "@/lib/brand/types";

/** Renders a vector scene as inline SVG (markup is produced by our own toSvg: hex colours only, escaped text). */
export function VecView({ vec, label, className = "" }: { vec: Vec; label?: string; className?: string }) {
  const html = useMemo(() => toSvg(vec).replace('role="img"', `role="img" aria-label="${(label ?? vec.title ?? "Artwork").replace(/"/g, "&quot;")}"`), [vec, label]);
  return <div className={`[&>svg]:block [&>svg]:h-auto [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** The logo with outlined lettering once fonts are ready; a skeleton while loading. */
export function LogoView({ spec, layout = "primary", scheme = "full", fonts, className = "", trimTo }: { spec: ConceptSpec; layout?: Layout; scheme?: Scheme; fonts: Fonts | null; className?: string; trimTo?: boolean }) {
  const vec = useMemo(() => {
    if (!fonts) return null;
    const r = renderLogo(spec, layout, scheme, fonts);
    const v = outlineScene(r.vec, fonts.glyph).vec;
    return trimTo ? { ...v, w: r.content.w, h: r.content.h, shapes: [{ t: "g" as const, children: v.shapes, tf: { tx: -r.pad, ty: -r.pad } }] } : v;
  }, [spec, layout, scheme, fonts, trimTo]);
  if (!vec) return <Skeleton className={`h-24 ${className}`} />;
  return <VecView vec={vec} label={`${spec.name} logo`} className={className} />;
}

/** Self-contained logo for places that don't manage fonts (moodboard cards, shared pages). */
export function LogoThumb({ spec, scheme = "full", className = "" }: { spec: ConceptSpec; scheme?: Scheme; className?: string }) {
  const { fonts, error } = useBrandFonts([spec]);
  return <LogoView spec={spec} scheme={scheme} fonts={fonts ?? (error ? NO_FONTS : null)} className={className} />;
}
