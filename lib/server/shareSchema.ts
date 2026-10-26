import { z } from "zod";

const s = (n = 600) => z.string().max(n);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const palette = z.object({
  id: s(80), name: s(120), harmony: s(120), mood: s(1200), locked: z.array(s(20)).max(10),
  colors: z.object({ primary: hex, secondary: hex, accent: hex, background: hex, surface: hex, text: hex, border: hex }),
  gradients: z.array(z.object({ name: s(80), css: s(400) })).max(6),
});
const direction = z.object({
  id: s(80), archetype: s(60), name: s(120), summary: s(1200), palette,
  fonts: z.object({ heading: s(80), body: s(80), mono: s(80).optional() }), fontRationale: s(1200),
  imageStyle: s(), illustrationStyle: s(), iconStyle: s(), logoDirection: s(),
  uiInspiration: z.array(s()).max(12), principles: z.array(s()).max(12), components: z.array(s()).max(16), brandReferences: z.array(s()).max(12),
});
const mood = z.discriminatedUnion("type", [
  z.object({ id: s(80), type: z.literal("swatch"), hex, label: s(60) }),
  z.object({ id: s(80), type: z.literal("type"), heading: s(80), body: s(80), sample: s(200) }),
  z.object({ id: s(80), type: z.literal("note"), text: s(800) }),
  z.object({ id: s(80), type: z.literal("link"), title: s(200), url: s(800), source: s(80) }),
  z.object({ id: s(80), type: z.literal("tag"), text: s(120), group: s(60) }),
]);
export const snapshotSchema = z.object({
  name: s(120),
  brief: s(3000),
  profile: z.object({
    projectType: s(), industry: s(), niche: s(), audience: s(), userNeeds: z.array(s()).max(12), businessGoals: z.array(s()).max(12), platforms: z.array(s()).max(12),
    brandPersonality: z.array(s()).max(12), visualMood: z.array(s()).max(12), designStyle: s(), typography: s(), colorDirection: s(), imageDirection: s(),
    keywords: z.array(s()).max(20), challenges: z.array(s()).max(12), summary: s(1200),
  }),
  directions: z.array(direction).max(6),
  selectedDirection: s(80).nullable(),
  moodboards: z.array(z.object({ id: s(80), name: s(120), directionId: s(80), updatedAt: z.number(), items: z.array(mood).max(80) })).max(8),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
