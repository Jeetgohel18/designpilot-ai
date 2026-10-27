# DesignPilot AI

An AI-first design research workspace. Describe a project → get an analysis, three creative directions, typography and color studios, reference/brand/asset sources, moodboards, an assistant, and developer-ready tokens. Rename the product any time in `lib/brand.ts`.

## Run it on your computer (5 minutes)

1. Install **Node.js 20 or newer** from nodejs.org (one-time).
2. Open a terminal in this folder and run:
   ```
   npm install
   npm run dev
   ```
3. Open **http://localhost:3000**.

That's it. No accounts or keys are required — features that need one switch themselves off and tell you why.

## What works right now (and how it was checked)

| Feature | Status | Notes |
|---|---|---|
| Landing page, project input, examples, settings | Working | Browser-tested |
| Project analysis (editable, regenerate from edits) | Working | Uses a **built-in rule-based engine** unless `GEMINI_API_KEY` is set. Labelled in the UI. |
| Three directions: compare, select, regenerate one | Working | Selected direction steers references, assets, moodboards, handoff |
| Typography explorer | Working | ~40 real Google Fonts, curated tags (labelled "curated"), live previews, copyable CSS / `<link>` |
| Color studio | Working | Edit/lock/replace colors, WCAG contrast (unit-tested), light/dark preview, gradients, CSS / JSON / W3C tokens / Tailwind export |
| References & competitors | Working with limits | Builds **search links** to Dribbble, Behance, Awwwards, etc. from your keywords. **Real ranked web results need a Brave key.** Nothing is invented. |
| Brand identity studio | Working | Editable brand profile, six generated **vector** logo concepts (wordmark, monogram, symbol, negative-space, emblem, editorial, technical…), variants, clear space / minimum size, mockups, SVG / PNG / JPEG / PDF export and a brand-kit ZIP. Concepts are generated locally from your answers; they are **not** checked for uniqueness or trademarks. (Original research links and image-generator prompts are under “Research & prompts”.) |
| Similar references | Working with limits | Project-specific searches in six groups. **Live results** from App Store (iTunes Search API) and GitHub need no key; web results need `BRAVE_SEARCH_API_KEY`. Everything else is a labelled search shortcut or curated link. |
| UI component library | Working | 58 components in six categories, rendered live with your direction's tokens, customizable, with PNG / JPEG / SVG (where genuinely vector) / PDF spec sheet / HTML / CSS / React-TSX / token exports. | **No image generation is connected.** |
| Icons / illustrations / images | Working with limits | Curated real libraries with licences. Live icon search (Iconify) and Unsplash photos need network/key (see below). |
| Moodboards | Working | Create from direction, drag to rearrange, add/remove, compare two, export JSON/Markdown |
| Design assistant | Working | Offline rule-based unless `GEMINI_API_KEY` is set; can take actions (alt palettes, "more premium") |
| Global search (Ctrl/Cmd+K) | Working | Transparent scoring (title match 3, other 1) |
| Developer handoff | Working | Brief (Markdown), CSS, tokens, Tailwind v4 theme, font setup; copy + download |
| My Projects | Working | Search, filter, favorite, rename, duplicate, delete with confirmation |
| Sharing (site + project + moodboard) | Working | Web Share API with copy-link fallback; read-only links with on/off switch, owner-key authorization |
| Accounts / login | **Not built** | See "Not done yet" |

Automated tests: `npm test` (26 tests — color math, engine, palette locking, share store + authorization, SSRF guard, AI-output validation, rate limiting).
I also drove the real UI with a browser script (40 checks: generate → edit → compare → select → fonts → colors → references → moodboard drag → handoff download → assistant → search → share/disable/re-enable → projects dashboard → mobile width). All passed.

## Optional keys (copy `.env.example` to `.env.local`)

| Key | Unlocks | Cost |
|---|---|---|
| `GEMINI_API_KEY` | Real AI analysis + assistant using Google Gemini (aistudio.google.com/apikey) | Free tier available; limits set by Google |
| `GOOGLE_FONTS_API_KEY` | Live font popularity & last-updated | Free |
| `BRAVE_SEARCH_API_KEY` | Real ranked web results in References | Free tier available |
| `UNSPLASH_ACCESS_KEY` | Live photo previews with attribution | Free demo tier (50 requests/hour) |

Keys stay on the server. Restart `npm run dev` after editing `.env.local`.

> **Not verified in my build environment:** the Gemini, Brave, Google Fonts, Unsplash and Iconify integrations. My sandbox has no keys, and blocked some of those hosts. Their code paths are written and their *input/output handling is tested*, but **please test each with your own key** and tell me if anything misbehaves. The link verifier ("Verify link") was tested only for its safety checks, not against live sites.

## Sharing, honestly

- Projects live in **your browser** (localStorage). They don't sync across devices, and clearing site data deletes them.
- A share link uploads a **snapshot** (not bookmarks/activity) to the server. Private is the default. You can disable the link at any time (it then returns "not found"), update the snapshot, or delete it.
- Only the browser that created a link holds its secret key, so only it can change or delete it. Wrong-key requests are rejected (tested).
- The server stores shares in `./.data/shares.json`. That's fine on your own computer or a server with a persistent disk. **On Vercel/serverless the disk resets**, so before a public launch swap `lib/server/shares.ts` for Supabase/Postgres (the interface is four small functions).

## Not done yet (next phases)

- **Real accounts + cloud database (Supabase)** so projects sync and sharing is tied to a login.
- Per-instance rate limits become shared limits (Upstash/Redis) when you host on multiple servers.
- Image generation for logo concepts.
- Verified screenshots for references (needs a permitted screenshot API).
- Placeholder legal text and social links (`lib/brand.ts`, `app/info/[slug]`) must be replaced before launch.

## Where things are

```
app/               pages + API routes (api/analyze, assistant, share, fonts, icons, images, references, verify)
components/        UI; components/workspace/ = one file per tab
lib/engine/        analysis, palettes, resources, handoff exports, offline assistant
lib/server/        share store, rate limit, SSRF guard, AI client (server only)
lib/brand.ts       product name, tagline, footer details
tests/             npm test
```

## Deploying later

`npm run build && npm run start` runs a production server. On Vercel, set the same environment variables in project settings plus `NEXT_PUBLIC_SITE_URL`, and replace the share store first (see above).

## Gemini AI: how to verify it on Vercel

1. In Vercel → your project → **Settings → Environment Variables**, confirm `GEMINI_API_KEY` exists for **Production** (and Preview if you use it). Don't prefix it with `NEXT_PUBLIC_`.
2. **Redeploy** (env var changes only apply to new deployments): Deployments tab → ⋯ on the latest → **Redeploy**.
3. Open `https://YOUR-SITE/api/ai-status` — it should show `"configured": true` (the key is never shown).
4. Open `https://YOUR-SITE/api/ai-status?test=1` — makes one tiny real Gemini call. `"working": true` means the key and model work. Otherwise `message` explains why (invalid key, free quota used up, etc.).
5. Generate a project. In the workspace the badge on **Analysis** says **AI-generated**. If it says **Generated locally**, a yellow notice explains the reason and the built-in engine was used.

Default models: `gemini-3.5-flash-lite`, then `gemini-3.1-flash-lite` (tried only if the first answers "model not found"). Google retired/restricted the 2.5 family for new keys, which answers with a 404. Set `GEMINI_MODEL` to force exactly one model (no substitution). The app never enables billing; if you hit the free quota it falls back to the built-in engine and says so.

### Finding out *why* Gemini fails (developer diagnostics)

`/api/ai-status?test=1` shows a safe category to everyone: `invalid_key`, `permission_denied`, `model_not_found`, `quota`, `invalid_request`, `timeout`, `network`, `provider` (temporary Google failure).
To see the exact HTTP status and Google's error codes, add an `AI_STATUS_TOKEN` environment variable in Vercel (a long random string, 16+ characters), redeploy, then run:

```
curl -H "Authorization: Bearer YOUR_TOKEN" "https://YOUR-SITE/api/ai-status?test=1"
curl -H "Authorization: Bearer YOUR_TOKEN" "https://YOUR-SITE/api/ai-status?models=1"
```
The second lists the model IDs your key can really use. Vercel → your project → **Logs** also shows redacted lines such as `Gemini call failed: kind=model_not_found http=404 status=NOT_FOUND`. API keys, headers and request bodies are never returned or logged.

### Timeouts

Each Gemini call has one shared time budget (analysis 50s, assistant 24s, diagnostic 35s) that is always below the route limit (`maxDuration` 60s / 30s). There are no retries; a slow call ends as a labelled fallback. Short calls ask Gemini for *minimal thinking* so answers come back quickly. Developer diagnostics:

- `?test=1` — tiny live call (one-word prompt, ≤32 output tokens, no tools).
- `?test=analyze` — runs the **real project-analysis pipeline** end to end (developer token required; uses more free quota).

Both report `modelUsed` and `elapsedMs` on success, and `model` + `elapsedMs` (developer view) on failure. Note: Vercel Hobby functions can run up to 60s with `maxDuration`; if your plan allows less, lower the budgets in `lib/server/analysis.ts`.

## Workspace guide (redesign)

The workspace is grouped as **Understand** (Overview, Creative directions) → **Explore** (Moodboard, Typography, Colors, UI components) → **Build** (Start designing, Brainstorming) → **Resources** (Inspiration & research, Logo & brand, Images & assets) → **Deliver** (Developer handoff, Export & download). Tabs are deep-linkable: `/workspace?p=<id>&tab=components`.

- **UI components** — 14 categories of live components styled with the selected direction. The preview and the copyable HTML + CSS come from one source (`lib/engine/componentCss.ts`). Plain HTML + CSS only; no framework code is generated.
- **Start designing** — screens, journeys, grid, type scale and checklist. Screens/journeys are *curated recommendations by project type*, labelled as such; type, spacing and color are computed from your direction. Progress is saved in this browser.
- **Brainstorming** — notes in six groups, status marking, tasks and requirements. "Generate more ideas" / "Refine" use Gemini via `/api/brainstorm`; if AI is unavailable, generation falls back to clearly labelled local suggestions and refine reports the failure without changing your notes.
- **Export & download** — 12 real files plus moodboard HTML/JSON and a single `.zip`. "PDF" = your browser's Print → Save as PDF on a print-ready page. Not provided: Figma/Canva files, moodboard images.
- **Research / Assets** — eight research categories and seven asset categories. Live results (Brave, Unsplash, Iconify) appear only when configured; everything else is curated or a source's own search page. SVG download is offered only for icon sets with a permissive SPDX licence.

Everything is stored in your browser (localStorage). Sharing creates a server-side *snapshot* link; it does not sync your project.

### Tests
`npm test` (109 tests, incl. the real Google SDK against a local fake Gemini server) and a Playwright browser run used during development (80 checks, 8 viewport widths). The browser script is not part of the repo.

## Component library, Similar references and Brand studio

- **UI components** — open a component to change variant, size, radius, weight, accent, spacing, background, border and shadow (defaults come from your selected direction). **Export** gives PNG/JPEG at 1×/2×/3× (non-blank guard, fonts embedded), SVG only where the component is real vector artwork (otherwise the dialog explains why), a PDF spec sheet with selectable text, standalone HTML (interactive behaviour included), CSS, type-checked React/TSX and W3C/CSS tokens. File names look like `afterhours-primary-button@2x.png`. Favorites and recently viewed are saved in the project.
- **Similar references** — each card says whether it is a **Live result** (returned by a source API just now), a **Search shortcut** (opens the site's own search) or **Curated**. Nothing is scraped; thumbnails appear only when an API returns one. Behance, Dribbble, Pinterest, Mobbin, Awwwards, Land-book, Godly, SiteInspire, Figma Community and Google Play are shortcuts because they have no open search API. Products are called "related", never "competitors", unless you say so. Save, add to a moodboard, or send to Brainstorming → Visual ideas.
- **Logo & brand** — pick one concept with "Use as my logo": it then appears in navigation/auth/dashboard component previews, the developer brief, a `brand-tokens.css` export and (if you add it) your moodboards. Logo files contain outlined lettering so they open correctly without the font.

New server routes (no keys): `/api/references/apps` (App Store search) and `/api/references/repos` (GitHub repository search, low unauthenticated rate limit, cached). `/api/font-file` serves Google font files so logos and exports can be drawn as outlines.

**Verification status for these features**: unit tests (vitest) cover the vector/PDF/ZIP writers, the component catalogue, reference planning, route mapping with a stubbed `fetch`, brand generation and the share schema; a Playwright run on the production build checked every export above (PNG/JPEG pixels, SVG with `xmllint`, PDF with `pdftotext`, ZIP integrity) and layouts from 320px to 1440px. **Not verified**: the live App Store, GitHub and Brave responses (my sandbox cannot reach them), so please try "Similar references" once on your deployed site.
