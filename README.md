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
| Project analysis (editable, regenerate from edits) | Working | Uses a **built-in rule-based engine** unless you add an Anthropic key. Labelled in the UI. |
| Three directions: compare, select, regenerate one | Working | Selected direction steers references, assets, moodboards, handoff |
| Typography explorer | Working | ~40 real Google Fonts, curated tags (labelled "curated"), live previews, copyable CSS / `<link>` |
| Color studio | Working | Edit/lock/replace colors, WCAG contrast (unit-tested), light/dark preview, gradients, CSS / JSON / W3C tokens / Tailwind export |
| References & competitors | Working with limits | Builds **search links** to Dribbble, Behance, Awwwards, etc. from your keywords. **Real ranked web results need a Brave key.** Nothing is invented. |
| Brand & logo concepts | Working with limits | Brand names to research + search links; original logo concept *descriptions* and prompts. **No image generation is connected.** |
| Icons / illustrations / images | Working with limits | Curated real libraries with licences. Live icon search (Iconify) and Unsplash photos need network/key (see below). |
| Moodboards | Working | Create from direction, drag to rearrange, add/remove, compare two, export JSON/Markdown |
| Design assistant | Working | Offline rule-based unless Anthropic key is set; can take actions (alt palettes, "more premium") |
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
| `ANTHROPIC_API_KEY` | Real AI analysis + assistant (console.anthropic.com) | Pay per use |
| `GOOGLE_FONTS_API_KEY` | Live font popularity & last-updated | Free |
| `BRAVE_SEARCH_API_KEY` | Real ranked web results in References | Free tier available |
| `UNSPLASH_ACCESS_KEY` | Live photo previews with attribution | Free demo tier (50 requests/hour) |

Keys stay on the server. Restart `npm run dev` after editing `.env.local`.

> **Not verified in my build environment:** the Anthropic, Brave, Google Fonts, Unsplash and Iconify integrations. My sandbox has no keys, and blocked some of those hosts. Their code paths are written and their *input/output handling is tested*, but **please test each with your own key** and tell me if anything misbehaves. The link verifier ("Verify link") was tested only for its safety checks, not against live sites.

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
