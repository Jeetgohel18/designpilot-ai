import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const swatches = ["#8b7cff", "#55d6e8", "#17171c", "#ececf1", "#6d172d"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#09090b", color: "#ececf1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#8b7cff", display: "flex" }} />
          {BRAND.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, display: "flex" }}>Start every project with the right direction</div>
          <div style={{ fontSize: 30, color: "#a1a1af", display: "flex" }}>{BRAND.tagline}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>{swatches.map((c) => <div key={c} style={{ width: 96, height: 24, borderRadius: 8, background: c, display: "flex" }} />)}</div>
      </div>
    ),
    size,
  );
}
