"use client";
import { useEffect, useMemo, useState } from "react";
import { toSvg } from "@/lib/vector/ir";
import { loadBrandFonts, outlined } from "@/lib/brand/export";
import { renderLogo, trimmed, type Fonts } from "@/lib/brand/render";
import type { ConceptSpec } from "@/lib/brand/types";
import type { Project } from "@/lib/types";

/** Loads the glyph outlines the given concepts need. `fonts` is null until ready; `error` when loading failed. */
export function useBrandFonts(specs: ConceptSpec[]): { fonts: Fonts | null; loading: boolean; error: boolean } {
  const key = [...new Set(specs.map((s) => `${s.font.family}@${s.font.weight}`))].sort().join("|");
  const [state, setState] = useState<{ key: string; fonts: Fonts | null; error: boolean }>({ key: "", fonts: null, error: false });
  useEffect(() => {
    if (!key) return;
    let live = true;
    loadBrandFonts(specs).then((fonts) => live && setState({ key, fonts, error: false })).catch(() => live && setState({ key, fonts: null, error: true }));
    return () => { live = false; };
    // specs is intentionally keyed by `key`: only the family/weight pairs matter for loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const ready = state.key === key;
  return { fonts: ready ? state.fonts : null, loading: !!key && !ready, error: ready && state.error };
}

export const selectedConcept = (p: Pick<Project, "brand">): ConceptSpec | undefined => p.brand?.concepts.find((c) => c.id === p.brand?.selected);

/** The selected brand logo as inline SVG (outlined lettering, trimmed to the artwork) for use inside UI previews. */
export function useBrandLogoSvg(p: Pick<Project, "brand">, dark: boolean): string | undefined {
  const spec = selectedConcept(p);
  const { fonts } = useBrandFonts(spec ? [spec] : []);
  return useMemo(() => {
    if (!spec || !fonts) return undefined;
    try { return toSvg(outlined(trimmed(renderLogo(spec, "horizontal", dark ? "white" : "full", fonts)), fonts)); } catch { return undefined; }
  }, [spec, fonts, dark]);
}
