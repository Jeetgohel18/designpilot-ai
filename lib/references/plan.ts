// Builds project-specific reference searches. Pure functions: no network, no invented results.
// Every item is labelled by where it really comes from (live API result, search shortcut, curated directory).
import { DESIGN_SYSTEMS } from "../engine/resources";
import type { Direction, Project } from "../types";

export type RefLabel = "live" | "shortcut" | "curated";
export type GroupId = "closest" | "visual" | "ux" | "products" | "branding" | "systems";
export type Platform = "any" | "web" | "mobile";

export interface RefItem {
  id: string; group: GroupId; title: string; url: string; source: string; label: RefLabel;
  /** Why this is shown, in plain words (never a claim about quality). */
  why: string; category: string; thumb?: string; description?: string;
}
export type LiveQuery = { kind: "web" | "apps" | "repos"; q: string };
export interface RefGroup { id: GroupId; label: string; desc: string; live: LiveQuery[]; shortcuts: RefItem[] }

export interface RefContext {
  type: string; industry: string; niche: string; audience: string; platform: Platform;
  features: string[]; style: string[]; aesthetic: string; direction?: string; flows: string[]; subject: string;
}

const e = encodeURIComponent;
const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const uniq = (a: string[]) => [...new Set(a.map((x) => x.toLowerCase().trim()).filter(Boolean))];
const GENERIC = new Set(["website", "web", "app", "application", "design", "modern", "clean", "simple", "user", "users", "product", "new", "good", "nice", "the", "and"]);

function platformOf(p: Project): Platform {
  const s = `${p.profile.projectType} ${p.profile.platforms.join(" ")}`.toLowerCase();
  const mobile = /mobile|ios|android|\bapp\b/.test(s), web = /web|site|landing|dashboard|saas|e-?commerce|portfolio/.test(s);
  return mobile && !web ? "mobile" : web && !mobile ? "web" : "any";
}

const FLOWS: [RegExp, string[]][] = [
  [/e-?commerce|shop|store|retail/i, ["product page", "checkout", "cart"]],
  [/saas|dashboard|admin|analytics/i, ["onboarding", "dashboard", "pricing page"]],
  [/mobile|app/i, ["onboarding", "sign up", "home screen"]],
  [/portfolio|agency|studio/i, ["case study page", "about page"]],
  [/landing|marketing|startup/i, ["hero section", "pricing page"]],
  [/blog|magazine|editorial|news/i, ["article page", "homepage"]],
  [/booking|travel|hotel|restaurant/i, ["booking flow", "search results"]],
];

export function refContext(p: Project, d?: Direction): RefContext {
  const pr = p.profile;
  const subject = clean(pr.niche || pr.industry || pr.keywords.find((k) => !GENERIC.has(k.toLowerCase())) || "");
  const flows = uniq(FLOWS.filter(([re]) => re.test(`${pr.projectType} ${pr.industry} ${pr.niche}`)).flatMap(([, f]) => f)).slice(0, 3);
  return {
    type: clean(pr.projectType || "website"), industry: clean(pr.industry), niche: clean(pr.niche), audience: clean(pr.audience.split(/[(,;]/)[0]),
    platform: platformOf(p),
    features: uniq([...pr.keywords, ...pr.businessGoals.slice(0, 2)]).filter((k) => !GENERIC.has(k) && k.split(" ").length <= 3).slice(0, 4),
    style: uniq([...(d ? [d.name] : []), ...pr.visualMood.slice(0, 2), pr.designStyle]).filter((k) => k && !GENERIC.has(k)).slice(0, 3),
    aesthetic: clean([...pr.visualMood.slice(0, 2), pr.designStyle].filter(Boolean).join(" ")),
    direction: d?.name, flows, subject,
  };
}

const sg = (name: string, group: GroupId, category: string, url: string, why: string, label: RefLabel = "shortcut"): RefItem => ({ id: `${group}:${name}:${url}`, group, title: name, url, source: name, label, why, category });
const google = (site: string, q: string) => `https://www.google.com/search?q=${e(`site:${site} ${q}`)}`;

/** Extra words typed by the user refine every group; they are added, never replace project context. */
export function buildGroups(c: RefContext, extra = "", platform: Platform = c.platform): RefGroup[] {
  const x = clean(extra);
  const subj = c.subject || c.type;
  const mobile = platform === "mobile", web = platform === "web";
  const kind = mobile ? "mobile app" : web ? "website" : c.type;
  const style = c.style.slice(0, 2).join(" ");
  const flow = c.flows[0] ?? "onboarding";
  const q = (...parts: string[]) => clean(parts.filter(Boolean).join(" "));
  const closeQ = q(subj, kind, "design", x);
  const visualQ = q(style || c.aesthetic, subj, kind, x);
  const uxQ = q(subj, kind, flow, "UX", x);
  const brandQ = q(subj, "brand identity logo", c.style[0] ?? "", x);
  const prodQ = q(subj, c.audience && c.audience.length < 40 ? "for " + c.audience : "", mobile ? "app" : web ? "platform" : "", x);
  const sysQ = q(web || !mobile ? "design system react components" : "design system mobile components", c.style[0] ?? "", x);
  const why = (what: string) => `Searches for “${what}”, built from your ${[c.niche && "niche", c.industry && "industry", c.platform !== "any" && "platform", c.style.length && "direction/mood"].filter(Boolean).join(", ") || "brief"}.`;

  const groups: RefGroup[] = [
    { id: "closest", label: "Closest matches", desc: "Work and products closest to your project type, subject and platform.",
      live: [{ kind: "web", q: closeQ }],
      shortcuts: [sg("Dribbble", "closest", "Visual shots", `https://dribbble.com/search/${e(closeQ)}`, why(closeQ)), sg("Behance", "closest", "Case studies", `https://www.behance.net/search/projects?search=${e(closeQ)}`, why(closeQ)), sg("Pinterest", "closest", "Visual boards", `https://www.pinterest.com/search/pins/?q=${e(closeQ)}`, why(closeQ))] },
    { id: "visual", label: "Similar visual styles", desc: "The look and feel of your chosen direction, in other industries and in yours.",
      live: [{ kind: "web", q: q(visualQ, "design inspiration") }],
      shortcuts: [sg("Awwwards", "visual", "Websites", google("awwwards.com", visualQ), why(visualQ) + " Site-restricted web search."), sg("Godly", "visual", "Websites", google("godly.website", visualQ), why(visualQ) + " Site-restricted web search."), sg("SiteInspire", "visual", "Websites", google("siteinspire.com", visualQ), why(visualQ) + " Site-restricted web search."), sg("Land-book", "visual", "Landing pages", google("land-book.com", visualQ), why(visualQ) + " Site-restricted web search.")] },
    { id: "ux", label: "Similar UX patterns", desc: `Flows and screens for ${c.flows.join(", ") || "your key journeys"}.`,
      live: [{ kind: "web", q: uxQ }],
      shortcuts: [sg("Mobbin", "ux", "Flows & screens", google("mobbin.com", q(subj, flow, x)), why(q(subj, flow)) + " Site-restricted web search (Mobbin's own search needs an account)."), sg("Page Flows", "ux", "User flows", google("pageflows.com", q(subj, flow, x)), why(q(subj, flow)) + " Site-restricted web search."), sg("Dribbble", "ux", "UI shots", `https://dribbble.com/search/${e(q(subj, flow, "ui"))}`, why(q(subj, flow, "ui")))] },
    { id: "products", label: "Related products", desc: "Real products in the same space. “Related” means found by search; confirm whether they are true competitors yourself.",
      live: [{ kind: "web", q: q("best", prodQ) }, ...(mobile || platform === "any" ? [{ kind: "apps" as const, q: q(subj, x) }] : [])],
      shortcuts: [sg("Google Play search", "products", "Android apps", `https://play.google.com/store/search?q=${e(q(subj, x))}&c=apps`, why(q(subj, x))), sg("Product Hunt", "products", "New products", `https://www.producthunt.com/search?q=${e(q(subj, x))}`, why(q(subj, x))), sg("Google: alternatives", "products", "Alternatives", `https://www.google.com/search?q=${e(q(subj, "alternatives"))}`, "Alternatives lists reveal the set of products people compare.")] },
    { id: "branding", label: "Branding & identity", desc: "Logo and identity work in a similar space or mood. Inspiration only, never to copy.",
      live: [{ kind: "web", q: brandQ }],
      shortcuts: [sg("Behance branding", "branding", "Identity projects", `https://www.behance.net/search/projects?search=${e(brandQ)}`, why(brandQ)), sg("Dribbble logos", "branding", "Logo shots", `https://dribbble.com/search/${e(brandQ)}`, why(brandQ)), sg("Pinterest identity", "branding", "Visual boards", `https://www.pinterest.com/search/pins/?q=${e(brandQ)}`, why(brandQ))] },
    { id: "systems", label: "Design systems & component libraries", desc: "Open design systems and component libraries you can study and borrow patterns from.",
      live: [{ kind: "repos", q: sysQ }],
      shortcuts: [sg("Figma Community", "systems", "Design files", `https://www.figma.com/community/search?resource_type=mixed&sort_by=relevancy&query=${e(q(subj, "design system ui kit", x))}`, why(q(subj, "ui kit"))), ...DESIGN_SYSTEMS.slice(0, 4).map((s) => ({ ...sg(s.name, "systems", "Design system", s.url, s.note, "curated"), description: s.license }))] },
  ];
  return groups;
}

export const GROUP_IDS: GroupId[] = ["closest", "visual", "ux", "products", "branding", "systems"];
