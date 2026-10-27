/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { ImageOff, X } from "lucide-react";
import { Dialog } from "./ui";

/** Lazy image with skeleton while loading and a labelled fallback when it fails — a broken URL never breaks a layout. */
export function SmartImage({ src, alt, className = "", ratio = "aspect-[4/3]", fallbackLabel = "Preview unavailable" }: { src: string; alt: string; className?: string; ratio?: string; fallbackLabel?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  return (
    <div className={`relative overflow-hidden bg-elevated ${ratio} ${className}`}>
      {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
      {state === "error" ? (
        <div role="img" aria-label={alt} className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-faint"><ImageOff size={18} aria-hidden /><span className="text-[11px]">{fallbackLabel}</span></div>
      ) : (
        <img src={src} alt={alt} loading="lazy" decoding="async" onLoad={() => setState("ok")} onError={() => setState("error")} className={`h-full w-full object-cover transition-opacity duration-300 ${state === "ok" ? "opacity-100" : "opacity-0"}`} />
      )}
    </div>
  );
}

export interface LightboxItem { src: string; alt: string; credit?: React.ReactNode; href?: string }

export function Lightbox({ item, onClose }: { item: LightboxItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onClose={onClose} title="Image preview" wide>
      {item && (
        <figure>
          <img src={item.src} alt={item.alt} className="max-h-[60dvh] w-full rounded-lg object-contain" />
          <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{item.credit}</span>
            {item.href && <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Open original ↗</a>}
          </figcaption>
        </figure>
      )}
      <span className="sr-only"><X /></span>
    </Dialog>
  );
}
