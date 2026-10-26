import { BRAND } from "@/lib/brand";

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#17171c" stroke="rgba(255,255,255,.14)" />
      <path d="M16 6.5 24.5 25 16 20.4 7.5 25 16 6.5Z" fill="#8b7cff" />
      <path d="M16 6.5 24.5 25 16 20.4V6.5Z" fill="#55d6e8" opacity=".85" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">{BRAND.short}<span className="text-faint font-normal"> AI</span></span>
    </span>
  );
}
