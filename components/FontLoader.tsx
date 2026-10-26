"use client";
import { useEffect } from "react";
import { googleFontsUrl } from "@/lib/fonts";

/** Loads Google Fonts CSS for the given families (once per URL). Previews fall back to system fonts until loaded. */
export function useGoogleFonts(names: string[], lite = false) {
  const key = [...new Set(names.filter(Boolean))].sort().join("|");
  useEffect(() => {
    if (!key) return;
    const url = googleFontsUrl(key.split("|"), lite);
    if (document.head.querySelector(`link[data-dpfont="${CSS.escape(url)}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = url; l.dataset.dpfont = url;
    document.head.appendChild(l);
  }, [key, lite]);
}

export function FontLoader({ names, lite = false }: { names: string[]; lite?: boolean }) { useGoogleFonts(names, lite); return null; }
