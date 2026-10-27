import type { Direction, Project } from "../types";
import { uiStyleOf, SPACING_UNIT } from "./uistyle";

// Contextual recommendations keyed on project type / industry. These are DesignPilot's curated suggestions for this KIND of
// project — they are not part of the AI analysis of the user's own brief, and the UI labels them that way.

export type WireKind = "landing" | "dashboard" | "list" | "form" | "product" | "detail" | "feed" | "settings" | "checkout" | "onboarding";
export interface ScreenRec { id: string; name: string; purpose: string; wire: WireKind; priority: 1 | 2 | 3 }

const S = (id: string, name: string, purpose: string, wire: WireKind, priority: 1 | 2 | 3 = 1): ScreenRec => ({ id, name, purpose, wire, priority });

const SETS: Record<string, { match: RegExp; label: string; screens: ScreenRec[]; journeys: string[] }> = {
  ecommerce: { match: /e-?commerce|store|shop/i, label: "E-commerce", screens: [S("home", "Home / landing", "Brand story, hero product and entry points to collections", "landing"), S("collection", "Collection / category", "Browse and filter products", "list"), S("pdp", "Product detail", "Photos, key facts, reviews and add-to-cart", "product"), S("cart", "Cart", "Review items, shipping and promo", "checkout"), S("checkout", "Checkout", "Address, delivery and payment with minimal friction", "checkout"), S("account", "Account & orders", "Order history, returns and saved items", "settings", 2), S("search", "Search results", "Query, filters and sorting", "list", 2)], journeys: ["Discover → product page → add to cart → checkout → confirmation", "Returning customer → reorder from account", "Search → filter → compare → purchase"] },
  saas: { match: /saas|software|platform|b2b|web application/i, label: "SaaS product", screens: [S("landing", "Marketing landing", "Explain the value in seconds and drive sign-up", "landing"), S("signup", "Sign-up / onboarding", "Create account and reach first success quickly", "onboarding"), S("dashboard", "Dashboard", "Overview of what matters now", "dashboard"), S("projects", "Project / item list", "Browse, search and manage records", "list"), S("detail", "Item detail", "Edit and collaborate", "detail", 2), S("settings", "Settings", "Profile, team and preferences", "settings", 2), S("billing", "Billing & plans", "Plan comparison, invoices and upgrades", "settings", 2)], journeys: ["Land → sign up → onboarding → first value moment", "Daily use: dashboard → open item → update → share", "Upgrade: hit limit → compare plans → pay"] },
  fintech: { match: /fintech|bank|finance|payment|invest|budget/i, label: "Fintech", screens: [S("onboard", "Onboarding & verification", "Account creation and identity checks with clear reassurance", "onboarding"), S("dash", "Dashboard", "Balance, recent activity and key insights", "dashboard"), S("tx", "Transactions", "Searchable, filterable activity list", "list"), S("budget", "Budgeting", "Categories, limits and progress", "dashboard", 2), S("goals", "Savings goals", "Create and track goals", "detail", 2), S("profile", "Profile & security", "Personal details, devices and security settings", "settings", 2)], journeys: ["Sign up → verify identity → fund account → first transaction", "Check balance → review spending → adjust budget", "Set a savings goal → automate → track progress"] },
  mobile: { match: /mobile app|ios|android|\bapp\b/i, label: "Mobile app", screens: [S("splash", "Welcome / onboarding", "Value proposition in 2–3 swipes, then sign-up", "onboarding"), S("home", "Home feed", "Primary content and next best action", "feed"), S("detail", "Detail screen", "Focused view with primary action", "detail"), S("create", "Create / log", "Fast data entry with large controls", "form"), S("profile", "Profile & settings", "Account, notifications and privacy", "settings", 2)], journeys: ["Install → onboarding → first action in under a minute", "Daily loop: open → act → see progress → leave", "Notification → deep link → completion"] },
  portfolio: { match: /portfolio|agency|studio|freelance/i, label: "Portfolio / studio", screens: [S("home", "Home", "Signature work and a clear positioning line", "landing"), S("work", "Work index", "Filterable grid of projects", "list"), S("case", "Case study", "Story, process and outcomes", "detail"), S("about", "About", "People, values and approach", "detail", 2), S("contact", "Contact", "Simple enquiry form", "form")], journeys: ["Land → browse work → open case study → contact", "Referral → case study → about → enquiry"] },
  landing: { match: /landing|campaign|event/i, label: "Landing page", screens: [S("landing", "Landing page", "One message, one call to action", "landing"), S("form", "Sign-up / lead form", "Short form with clear consent", "form"), S("thanks", "Thank-you / confirmation", "Confirm and suggest the next step", "detail", 2)], journeys: ["Ad or link → landing → form → confirmation"] },
  education: { match: /education|learning|course|student/i, label: "Learning product", screens: [S("home", "Home / catalogue", "Find a course or continue learning", "landing"), S("course", "Course overview", "Syllabus, outcomes and enrol", "detail"), S("lesson", "Lesson player", "Content with progress and notes", "detail"), S("progress", "Progress dashboard", "Streaks, goals and achievements", "dashboard", 2), S("profile", "Profile & settings", "Account and preferences", "settings", 2)], journeys: ["Browse → enrol → first lesson → completion", "Return → resume → streak"] },
  wellness: { match: /wellness|health|clinic|therapy|meditation/i, label: "Health & wellness", screens: [S("home", "Home", "Reassuring overview and primary action", "landing"), S("services", "Services / programs", "What's offered and for whom", "list"), S("profile", "Practitioner profile", "Credentials and approach", "detail", 2), S("booking", "Booking flow", "Choose time, confirm, reminders", "form"), S("account", "Account", "History and preferences", "settings", 2)], journeys: ["Learn → choose service → book → confirmation and reminders"] },
  generic: { match: /./, label: "Digital product", screens: [S("home", "Home", "Value proposition and primary action", "landing"), S("list", "Browse / list", "Find the right item", "list"), S("detail", "Detail", "Everything needed to decide", "detail"), S("form", "Sign-up / contact", "Conversion form", "form"), S("settings", "Account / settings", "Preferences and help", "settings", 2)], journeys: ["Land → understand → take the primary action → confirmation"] },
};

export function starterSet(p: Project) {
  const hay = `${p.profile.projectType} ${p.profile.industry} ${p.profile.niche} ${p.brief}`;
  // Most specific first: industry-specific sets win over generic project-type ones.
  const ORDER = ["ecommerce", "fintech", "education", "wellness", "portfolio", "landing", "saas", "mobile"];
  const key = ORDER.find((k) => SETS[k].match.test(hay)) ?? "generic";
  return { key, ...SETS[key] };
}

export interface TypeStep { name: string; size: number; line: number; use: string }

/** Modular type scale. Ratio follows the direction's density: airy 1.333 (perfect fourth), comfortable 1.25 (major third), compact 1.2 (minor third). */
export function typeScale(d: Direction): { ratio: number; base: number; steps: TypeStep[] } {
  const density = uiStyleOf(d).density;
  const ratio = density === "airy" ? 1.333 : density === "compact" ? 1.2 : 1.25;
  const base = 16;
  const at = (n: number) => Math.round(base * Math.pow(ratio, n));
  return { ratio, base, steps: [
    { name: "Display", size: at(5), line: 1.05, use: "Hero headline (desktop)" }, { name: "H1", size: at(4), line: 1.1, use: "Page titles" }, { name: "H2", size: at(3), line: 1.2, use: "Section headings" },
    { name: "H3", size: at(2), line: 1.25, use: "Card titles" }, { name: "H4", size: at(1), line: 1.3, use: "Subheadings" }, { name: "Body", size: base, line: 1.6, use: "Paragraphs and UI" }, { name: "Small", size: Math.round(base / ratio), line: 1.5, use: "Captions, labels, metadata" },
  ] };
}

export function gridGuidance(d: Direction) {
  const unit = SPACING_UNIT[uiStyleOf(d).density];
  return {
    unit,
    spacing: [0.5, 1, 1.5, 2, 3, 4, 6, 8, 12].map((m) => Math.round(unit * m)),
    breakpoints: [["Mobile", "320–639px", "4 columns, 16px gutters, 16px margins"], ["Tablet", "640–1023px", "8 columns, 24px gutters, 32px margins"], ["Desktop", "1024px+", "12 columns, 24px gutters, max content width 1200px"]] as [string, string, string][],
  };
}

export const STATES = ["Empty state (explain, then offer the first action)", "Loading state (skeletons that match the final layout)", "Success state (confirm what happened and what's next)", "Error state (say what went wrong and how to recover; keep user input)", "Offline / slow network (mobile)", "Permission or paywall state, if applicable"];
export const ACCESSIBILITY = ["Text contrast at least 4.5:1 (3:1 for large text and UI borders)", "Every control reachable and operable by keyboard with a visible focus ring", "Touch targets at least 44×44px on mobile", "Don't rely on color alone — pair with icon or text", "Label every form field; show errors next to the field in text", "Respect reduced-motion preferences", "Use real headings in order (one H1 per page)"];

export function checklist(p: Project, d: Direction): { id: string; group: string; text: string }[] {
  const set = starterSet(p);
  const first = set.screens.filter((s) => s.priority === 1).map((s) => s.name);
  return [
    { id: "c1", group: "Foundations", text: "Confirm the chosen direction with stakeholders" },
    { id: "c2", group: "Foundations", text: `Set up color tokens (${Object.keys(d.palette.colors).length} roles) and check contrast` },
    { id: "c3", group: "Foundations", text: `Set up type: ${d.fonts.heading} + ${d.fonts.body}, with fallbacks` },
    { id: "c4", group: "Foundations", text: "Define the spacing scale and grid" },
    { id: "c5", group: "Components", text: `Design core components first: ${d.components.slice(0, 4).join(", ")}` },
    { id: "c6", group: "Components", text: "Cover default, hover, focus, disabled, loading and error states" },
    { id: "c7", group: "Screens", text: `Wireframe the priority screens: ${first.join(", ")}` },
    { id: "c8", group: "Screens", text: "Design mobile first, then tablet and desktop" },
    { id: "c9", group: "Screens", text: "Design empty, loading, success and error states for each screen" },
    { id: "c10", group: "Quality", text: "Run an accessibility pass (contrast, keyboard, labels)" },
    { id: "c11", group: "Quality", text: "Test the main journey with 3–5 real users" },
    { id: "c12", group: "Handoff", text: "Export tokens and component specs from the Export tab" },
  ];
}
