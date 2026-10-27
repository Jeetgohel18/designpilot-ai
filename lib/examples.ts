export const EXAMPLES = [
  { label: "Skincare store", text: "I want to build a premium skincare e-commerce website targeting Gen Z, with a luxurious minimal aesthetic, organic ingredients, elegant typography, a mobile-first shopping experience, and a distinctive brand identity." },
  { label: "Fintech dashboard", text: "A fintech web dashboard for freelancers to track invoices, taxes and cash flow. It should feel trustworthy and precise, with clear data visualisation and a calm professional tone." },
  { label: "Coffee roaster", text: "Brand and website for a small-batch specialty coffee roaster with a subscription shop. Warm, craft and slightly retro, with a strong story about farmers and roasting." },
  { label: "Meditation app", text: "A mobile meditation and sleep app for stressed professionals. Calm, soothing and accessible, with soft colors and a friendly voice." },
  { label: "Creative studio", text: "A portfolio website for a bold, editorial branding studio that wants to win ambitious clients. Oversized typography, confident contrast and playful details." },
];

/** Starter templates by project type: a complete sentence the user then edits. icon names map to lucide in BriefInput. */
export const PROJECT_TYPES = [
  { id: "mobile", label: "Mobile app", icon: "Smartphone", template: "A mobile app that helps [who it's for] to [main goal]. It should feel [mood], with simple navigation and a thumb-friendly layout." },
  { id: "saas", label: "SaaS product", icon: "Layers", template: "A SaaS product for [who it's for] that helps them [main benefit]. The marketing site and app should feel [mood] and make the value clear within seconds." },
  { id: "ecommerce", label: "E-commerce", icon: "ShoppingBag", template: "An online store selling [products] to [who it's for]. The brand should feel [mood], with a fast mobile checkout and clear product pages." },
  { id: "portfolio", label: "Portfolio", icon: "Briefcase", template: "A portfolio website for [a designer / studio / photographer] who wants to attract [type of clients]. The tone is [mood], and the work should be the hero." },
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", template: "A dashboard for [who it's for] to track [what they track]. It should feel [mood], with clear data visualisation, filters and readable tables." },
  { id: "landing", label: "Landing page", icon: "PanelTop", template: "A landing page for [product or event] aimed at [audience], with one clear call to action. The style is [mood]." },
  { id: "brand", label: "Brand identity", icon: "Fingerprint", template: "A brand identity for [business] serving [audience], including logo direction, colors and typography. The personality is [mood]." },
] as const;
