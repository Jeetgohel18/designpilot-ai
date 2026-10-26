// Curated directories of REAL tools and sources. Nothing here is a fabricated "result":
// each entry is a known site; per-project entries are *search links* built from the brief's keywords.
export interface SourceLink { name: string; url: string; note: string; license?: string; kind: "search" | "directory" }

const e = encodeURIComponent;
const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");

export function referenceSearchLinks(q: string): SourceLink[] {
  return [
    { name: "Dribbble", url: `https://dribbble.com/search/${e(q)}`, note: "Shots by designers: UI, branding, illustration", kind: "search" },
    { name: "Behance", url: `https://www.behance.net/search/projects?search=${e(q)}`, note: "Full case studies and brand identity projects", kind: "search" },
    { name: "Awwwards", url: `https://www.google.com/search?q=${e(`site:awwwards.com ${q}`)}`, note: "Award-winning websites (site-restricted web search)", kind: "search" },
    { name: "Land-book", url: `https://www.google.com/search?q=${e(`site:land-book.com ${q}`)}`, note: "Curated landing pages (site-restricted web search)", kind: "search" },
    { name: "Godly", url: `https://www.google.com/search?q=${e(`site:godly.website ${q}`)}`, note: "Astronomically good web design (site-restricted web search)", kind: "search" },
    { name: "Pinterest", url: `https://www.pinterest.com/search/pins/?q=${e(q)}`, note: "Broad visual moodboard material", kind: "search" },
    { name: "Mobbin", url: `https://mobbin.com/`, note: "Real mobile & web app screens and flows — search inside the site", kind: "directory" },
    { name: "Page Flows", url: `https://pageflows.com/`, note: "Recorded user flows from real products", kind: "directory" },
  ];
}

export function competitorSearchLinks(terms: string[]): SourceLink[] {
  const q = terms[0] ?? "website";
  return [
    { name: "Google: competitors", url: `https://www.google.com/search?q=${e(`best ${q}`)}`, note: "Find live competitors to audit", kind: "search" },
    { name: "Google: alternatives", url: `https://www.google.com/search?q=${e(`${q} alternatives`)}`, note: "Alternatives lists reveal the competitive set", kind: "search" },
    { name: "Product Hunt", url: `https://www.producthunt.com/search?q=${e(q)}`, note: "Newer products in the space", kind: "search" },
    { name: "SimilarWeb (look up a domain)", url: `https://www.similarweb.com/`, note: "Estimated traffic and similar sites for a domain you already know", kind: "directory" },
  ];
}

export function brandSearchLinks(brand: string): SourceLink[] {
  return [
    { name: "Brand guidelines", url: `https://www.google.com/search?q=${e(`${brand} brand guidelines`)}`, note: "Look for the official guidelines or press kit", kind: "search" },
    { name: "Identity projects", url: `https://www.behance.net/search/projects?search=${e(`${brand} brand identity`)}`, note: "Third-party identity case studies", kind: "search" },
    { name: "Brandfetch", url: `https://brandfetch.com/`, note: "Brand assets and colors by domain (check each brand's own guidelines)", kind: "directory" },
  ];
}

export const ICON_LIBRARIES: (SourceLink & { styles: string[]; pkg: string; install: string })[] = [
  { name: "Lucide", url: "https://lucide.dev/icons/", note: "Consistent 24px outline set, community maintained", license: "ISC", styles: ["line"], pkg: "lucide-react", install: "npm i lucide-react", kind: "directory" },
  { name: "Phosphor", url: "https://phosphoricons.com/", note: "Six weights: thin, light, regular, bold, fill, duotone", license: "MIT", styles: ["line", "filled", "duotone"], pkg: "@phosphor-icons/react", install: "npm i @phosphor-icons/react", kind: "directory" },
  { name: "Heroicons", url: "https://heroicons.com/", note: "By the Tailwind CSS team: outline and solid", license: "MIT", styles: ["line", "filled"], pkg: "@heroicons/react", install: "npm i @heroicons/react", kind: "directory" },
  { name: "Tabler Icons", url: "https://tabler.io/icons", note: "5,000+ icons with stroke width control", license: "MIT", styles: ["line", "filled"], pkg: "@tabler/icons-react", install: "npm i @tabler/icons-react", kind: "directory" },
  { name: "Remix Icon", url: "https://remixicon.com/", note: "Neutral line and fill pairs", license: "Apache-2.0", styles: ["line", "filled"], pkg: "remixicon", install: "npm i remixicon", kind: "directory" },
  { name: "Iconoir", url: "https://iconoir.com/", note: "Open-source, slightly more expressive outline set", license: "MIT", styles: ["line"], pkg: "iconoir-react", install: "npm i iconoir-react", kind: "directory" },
  { name: "Material Symbols", url: "https://fonts.google.com/icons", note: "Variable icon font with weight/fill/grade axes", license: "Apache-2.0", styles: ["line", "filled"], pkg: "@material-symbols/font-400", install: "npm i @material-symbols/font-400", kind: "directory" },
  { name: "Iconify (aggregator)", url: "https://icon-sets.iconify.design/", note: "Search 100+ open-source icon sets at once", license: "Varies per set", styles: ["line", "filled", "duotone"], pkg: "@iconify/react", install: "npm i @iconify/react", kind: "directory" },
  { name: "Lordicon", url: "https://lordicon.com/", note: "Animated icons (free tier has limits — read the licence)", license: "Free + paid tiers", styles: ["animated"], pkg: "@lordicon/react", install: "npm i @lordicon/react", kind: "directory" },
  { name: "LottieFiles", url: "https://lottiefiles.com/free-animations", note: "Animated assets in Lottie format — licence varies per file", license: "Varies per file", styles: ["animated"], pkg: "lottie-react", install: "npm i lottie-react", kind: "directory" },
];

export const ILLUSTRATION_SOURCES: (SourceLink & { styles: string[] })[] = [
  { name: "unDraw", url: "https://undraw.co/illustrations", note: "Recolourable flat SVG illustrations", license: "unDraw open licence (free for commercial use) — confirm on site", styles: ["2D", "flat"], kind: "directory" },
  { name: "Open Peeps", url: "https://www.openpeeps.com/", note: "Hand-drawn people you can mix and match", license: "CC0 (per site) — confirm on site", styles: ["2D", "hand-drawn", "editorial"], kind: "directory" },
  { name: "Humaaans", url: "https://www.humaaans.com/", note: "Mix-and-match people illustrations", license: "CC0 (per site) — confirm on site", styles: ["2D", "flat"], kind: "directory" },
  { name: "Open Doodles", url: "https://www.opendoodles.com/", note: "Free sketchy doodle illustrations", license: "CC0 (per site) — confirm on site", styles: ["2D", "hand-drawn"], kind: "directory" },
  { name: "Storyset", url: "https://storyset.com/", note: "Customisable animated illustrations", license: "Free with attribution; paid removes it — confirm on site", styles: ["2D", "animated"], kind: "directory" },
  { name: "3dicons", url: "https://3dicons.co/", note: "3D icon pack (PNG/Blender/Figma)", license: "CC0 (per site) — confirm on site", styles: ["3D"], kind: "directory" },
  { name: "Blush", url: "https://blush.design/", note: "Illustration collections from independent artists", license: "Varies per collection — read each", styles: ["2D", "editorial", "abstract"], kind: "directory" },
];

export function imageSearchLinks(q: string): (SourceLink)[] {
  return [
    { name: "Unsplash", url: `https://unsplash.com/s/photos/${slug(q)}`, note: "High-quality photography", license: "Unsplash License (free commercial; don't resell as-is) — confirm on site", kind: "search" },
    { name: "Pexels", url: `https://www.pexels.com/search/${e(q)}/`, note: "Photos and video", license: "Pexels License — confirm on site", kind: "search" },
    { name: "Pixabay", url: `https://pixabay.com/images/search/${e(q)}/`, note: "Photos, vectors, illustrations", license: "Pixabay Content License — confirm on site", kind: "search" },
  ];
}

export const UI_RESOURCES: SourceLink[] = [
  { name: "shadcn/ui", url: "https://ui.shadcn.com/", note: "Copy-paste accessible React components built on Radix + Tailwind", license: "MIT", kind: "directory" },
  { name: "Radix UI", url: "https://www.radix-ui.com/", note: "Unstyled, accessible primitives", license: "MIT", kind: "directory" },
  { name: "Headless UI", url: "https://headlessui.com/", note: "Accessible unstyled components by Tailwind Labs", license: "MIT", kind: "directory" },
  { name: "Mantine", url: "https://mantine.dev/", note: "Full-featured React component library", license: "MIT", kind: "directory" },
  { name: "daisyUI", url: "https://daisyui.com/", note: "Tailwind component classes and themes", license: "MIT", kind: "directory" },
  { name: "Figma Community", url: "https://www.figma.com/community", note: "UI kits, templates and plugins (licences vary per file)", license: "Varies per file", kind: "directory" },
  { name: "Tailwind CSS", url: "https://tailwindcss.com/docs", note: "Utility-first CSS framework", license: "MIT", kind: "directory" },
  { name: "Next.js", url: "https://nextjs.org/docs", note: "React framework for production sites", license: "MIT", kind: "directory" },
];

export const TOOLS: SourceLink[] = [
  { name: "Realtime Colors", url: "https://www.realtimecolors.com/", note: "Preview a palette and fonts on a live site", kind: "directory" },
  { name: "Coolors", url: "https://coolors.co/", note: "Palette generator and explorer", kind: "directory" },
  { name: "WebAIM Contrast Checker", url: "https://webaim.org/resources/contrastchecker/", note: "Independent WCAG contrast check", kind: "directory" },
  { name: "Google Fonts", url: "https://fonts.google.com/", note: "Open-source font library", kind: "directory" },
  { name: "Fontsource", url: "https://fontsource.org/", note: "Self-host open-source fonts via npm", kind: "directory" },
  { name: "Type Scale", url: "https://typescale.com/", note: "Preview modular type scales", kind: "directory" },
  { name: "Looka", url: "https://looka.com/", note: "AI logo maker (paid to download)", kind: "directory" },
  { name: "Wordmark.it", url: "https://wordmark.it/", note: "Preview a brand name in your installed fonts", kind: "directory" },
  { name: "Logoipsum", url: "https://logoipsum.com/", note: "Placeholder logos for mockups", kind: "directory" },
];

export const LOGO_TYPES = [
  { type: "Wordmark", how: "The name set in custom or carefully chosen type. Best when the name is short and distinctive." },
  { type: "Monogram", how: "Initials locked up in a shape. Works for app icons, favicons and packaging seals." },
  { type: "Symbol", how: "A standalone mark (pictorial or abstract). Needs budget to build recognition." },
  { type: "Combination mark", how: "Symbol + wordmark lockup with separate and stacked versions. Most flexible for web." },
];
