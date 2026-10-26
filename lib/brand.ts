// Change the product name here and it updates everywhere (UI, metadata, share cards).
export const BRAND = {
  name: "DesignPilot AI",
  short: "DesignPilot",
  tagline: "Design intelligence for the first week of every project.",
  description:
    "Describe a project and get a research workspace: creative directions, type, color, references, brand and asset sources, plus developer-ready tokens.",
  // Set NEXT_PUBLIC_SITE_URL in production so share links and social cards use your domain.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

// Footer details — replace these placeholders with your real accounts before launch.
export const FOOTER = {
  contactEmail: "" as string, // e.g. "hello@yourdomain.com"; Contact page shows setup instructions while empty
  social: [
    { label: "X", url: "https://x.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com" },
    { label: "Dribbble", url: "https://dribbble.com" },
    { label: "GitHub", url: "https://github.com" },
  ],
};
