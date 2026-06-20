# Pulse 360°

> *Stay ahead. Stay informed. Stay in control.*

**Pulse 360°** is a product-agnostic news and update portal that unifies Microsoft's official update streams — Microsoft 365, Azure, Fabric, Power Platform, Dynamics 365, Copilot, and the Microsoft Security Response Center (MSRC) — into a single fast, filterable, dark-mode-first dashboard.

Live site: **<https://www.mspulse360.app>**

Built with the Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and Radix UI. Server Components do the heavy lifting; client components add interactivity. There are no third-party trackers other than Vercel Analytics / Speed Insights.

---

## Table of Contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture overview](#architecture-overview)
- [Data sources](#data-sources)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Configuration](#configuration)
  - [Required environment variables](#required-environment-variables)
  - [Optional environment variables](#optional-environment-variables)
  - [Creating the Microsoft Entra app registration](#creating-the-microsoft-entra-app-registration)
  - [Database (Prisma)](#database-prisma)
- [Running the app](#running-the-app)
- [Routes reference](#routes-reference)
  - [Pages](#pages)
  - [API routes](#api-routes)
- [Using the site](#using-the-site)
- [Testing](#testing)
- [Linting, formatting, and type checks](#linting-formatting-and-type-checks)
- [Deployment](#deployment)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## What it does

Pulse 360° pulls signals from the official Microsoft update channels and renders them in a consistent UI with the same filtering, search, and drill-through behavior across every product area:

- **Microsoft 365 Message Center** — live tenant messages via Microsoft Graph (`/admin/serviceAnnouncement/messages`)
- **MSRC Security Updates** — official CVRF data from `api.msrc.microsoft.com`, with month picker, per-CVE cards, KB articles, downloads, weakness (CWE) info, and revision history
- **Release Plans** — Azure, Microsoft 365, Fabric, and Dynamics / Power Platform release planners
- **Fabric & Power Platform Roadmap** — grouped by product, collapsible, drill-through detail pages
- **Product News** — aggregated RSS/Atom feeds for Power BI, Power Apps, Power Automate, Power Platform, Microsoft News, Tech Community, Learn Blog, Copilot, Copilot Studio, Azure AI Foundry, Azure AI/ML, Semantic Kernel, VS Code, Windows, and Microsoft Fabric Blog
- **M365 / Azure Updates** — dedicated feeds with per-item detail pages
- **Global filtering and search** — Product, Area, Date, and Major Changes filters; case- and whitespace-insensitive search

Every list is sorted newest-first, every card is keyboard-navigable, and every page works in both light and dark mode.

## Screenshots

The repo currently ships without screenshots in `public/`. If you take any while developing, drop them into `public/images/` and link them here.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Turbopack) |
| Language | **TypeScript 5.9** |
| UI runtime | **React 19** |
| Styling | **Tailwind CSS 4** + `@tailwindcss/typography` |
| Components | **Radix UI** primitives (Accordion, Popover, Icons) + Headless UI + Heroicons |
| State / data | **React Query 5** for client cache, **Zustand 5** for filter state, React Server Components for fetches |
| Database (optional) | **Prisma 7** → **PostgreSQL** (generated client lives in `src/generated/prisma`) |
| Auth (optional) | **NextAuth 4** + **@azure/msal-browser 4** (scaffolded; see [Configuration](#configuration)) |
| Microsoft Graph | App-only client credentials flow (no user sign-in required for Message Center) |
| Feed parsing | `fast-xml-parser`, `xml2js`, `rss-parser` |
| Sanitization | `isomorphic-dompurify` (server-rendered HTML from feeds) |
| Telemetry | `@vercel/analytics`, `@vercel/speed-insights` |
| Tests | **Playwright 1.57** (Chromium, Firefox, WebKit) |
| Hosting target | Vercel (works anywhere Node 20 + Next.js 16 runs) |

**Engines:** Node `>=20.17.0 <21.0.0`, npm `>=10.0.0`. Newer Node majors (22+) are not pinned because Next.js 16's edge runtime and Prisma 7 are validated against 20.x here.

---

## Architecture overview

```
                       ┌────────────────────────────────────┐
                       │            Browser (RSC)           │
                       │  React Server Components hydrate   │
                       │   client islands (filters, modals) │
                       └────────────┬───────────────────────┘
                                    │
                                    ▼
                       ┌────────────────────────────────────┐
                       │     Next.js 16 (App Router)        │
                       │  - Server Components fetch data    │
                       │  - Route handlers act as a server- │
                       │    side proxy for cross-origin /   │
                       │    bot-protected upstreams         │
                       └────┬───────────────┬───────────────┘
                            │               │
              client creds  │               │ public REST / RSS
                            ▼               ▼
            ┌──────────────────────┐  ┌──────────────────────┐
            │   Microsoft Graph    │  │  MSRC CVRF API +     │
            │  (Message Center)    │  │  *.microsoft.com     │
            └──────────────────────┘  │  RSS feeds (allow-   │
                                      │  listed)             │
                                      └──────────────────────┘
```

Key design choices:

- **Server-first data fetching.** `src/lib/api.server.ts` is marked `server-only`. Secrets never reach the browser.
- **No client-side Microsoft Graph tokens.** The browser talks to `/api/messages`; the server holds the Entra app credentials and proxies Graph.
- **Allowlist-secured RSS proxy.** `/api/proxy-rss` only fetches from a fixed list of `*.microsoft.com` hosts to prevent SSRF.
- **Strict MSRC input validation.** `/api/msrc?monthId=...` validates `monthId` against `^\d{4}-[A-Za-z]{3}$` before forwarding.
- **Caching.** Server fetches use Next.js `revalidate` hints (typically 1 hour for news, 24 hours for Graph). The Graph proxy disables caching for paginated responses that may exceed Next.js's 2 MB cache cap.
- **Per-request console silencing in production** (`src/lib/api.server.ts`, `src/app/layout.tsx`) to avoid leaking diagnostic payloads to hosting logs.

---

## Data sources

| Source | Used for | Auth | Cache |
|---|---|---|---|
| `graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages` | M365 Message Center | App-only OAuth (client credentials) | 24 h |
| `api.msrc.microsoft.com/cvrf/v3.0/updates` and `/cvrf/v3.0/cvrf/{monthId}` | MSRC CVE data | Public | per-request |
| `releaseplanner.azure-api.net/fabric/fabric-json/?productId=...` | Fabric roadmap | Public | no-store |
| `devblogs.microsoft.com/foundry/feed/` | Azure AI Foundry news | Public RSS | 1 h |
| `devblogs.microsoft.com/*`, `blogs.windows.com`, `blogs.microsoft.com`, `techcommunity.microsoft.com`, `azure.microsoft.com`, `cloudblogs.microsoft.com`, `powerplatform.microsoft.com`, `www.microsoft.com`, `microsoft.com` | Product News feeds | Public RSS via `/api/proxy-rss` allowlist | 10 min edge / 1 h app |
| `learn.microsoft.com` (HTML table scrape) | Copilot Studio release plan | Public | 1 h |

If an upstream is down, list endpoints return `200` with an empty array so the UI degrades gracefully — never a 5xx visible to the user.

---

## Project structure

```
.
├── prisma/
│   └── schema.prisma            # User / Preference / PublishedListing models
├── public/                      # Static assets (icons, images)
│   ├── icons/azure/             # 1,000+ official Azure SVG icons by category
│   └── images/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Theme provider, nav, error boundary, RQ provider
│   │   ├── page.tsx             # redirect → /home
│   │   ├── home/                # Landing dashboard
│   │   ├── about/
│   │   ├── message-center/      # M365 Message Center list
│   │   ├── message/[id]/        # Message detail
│   │   ├── m365-updates/        # M365 update feed
│   │   ├── m365-update/[id]/    # M365 update detail
│   │   ├── azure-updates/       # Azure update feed
│   │   ├── azure-update/[id]/   # Azure update detail
│   │   ├── fabric-roadmap/      # Fabric + Power Platform roadmap
│   │   ├── release-plans/       # Hub + /azure, /m365, /fabric, /dynamics-power, /roadmap
│   │   ├── release-plan/[id]/   # Release plan detail
│   │   ├── msrc/                # MSRC vulnerabilities (+ /blog subroute)
│   │   ├── security/            # Security overview
│   │   ├── product-news/        # Aggregated product news + 15+ subroutes
│   │   ├── map/, test-map/      # Experimental visualizations
│   │   ├── powerplatd365/       # Power Platform / D365 release plans landing
│   │   └── api/                 # 20+ route handlers (see below)
│   ├── components/              # Cards, filters, lists, nav, theme toggle
│   ├── lib/
│   │   ├── api.server.ts        # `server-only` Graph client (Message Center)
│   │   ├── api.client.ts        # Client-side RSS/news fetchers
│   │   ├── fabricApi.ts         # Fabric roadmap client
│   │   ├── getProductIcon.ts    # Product → icon mapping
│   │   ├── releasePlanIcons.ts
│   │   └── types.ts             # Shared TypeScript types
│   ├── generated/prisma/        # Auto-generated; gitignored
│   └── types/                   # Module declarations for SVG / xml2js
├── tests/                       # Playwright specs
├── playwright.config.ts
├── next.config.js               # Image whitelist, Turbopack root
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.mjs
└── tsconfig.json
```

---

## Quick start

Prereqs: **Node 20.17+ (< 21)**, **npm 10+**, **Git**. Postgres only if you intend to use the Prisma models (most features don't need it).

```bash
git clone https://github.com/russrimm/Pulse360.git
cd Pulse360
npm install
# Create .env.local — see Configuration below
npm run dev
```

Open <http://localhost:3000>. The root path redirects to `/home`.

> **No env vars?** The app still boots in production mode and the Message Center endpoint returns an empty array. RSS-driven pages (Product News, AI Foundry News, etc.) work without any credentials. In development mode, missing Graph credentials throw at startup — set them or comment out the Message Center calls.

---

## Configuration

### Required environment variables

Pulse 360° reads its configuration from a `.env.local` file at the repo root (Next.js convention — automatically gitignored).

| Variable | Required? | Purpose |
|---|---|---|
| `AZURE_CLIENT_ID` | Yes, for Message Center | Application (client) ID of the Entra app registration |
| `AZURE_TENANT_ID` | Yes, for Message Center | Directory (tenant) ID |
| `AZURE_CLIENT_SECRET` | Yes, for Message Center | Client secret value (treat as a password — rotate regularly) |
| `AZURE_API_URL` | No | Overrides the Graph base URL. Defaults to `https://graph.microsoft.com/v1.0`. Useful only for Graph national clouds (e.g. Gov, China). |

Create `.env.local` (use placeholders — never commit real secrets):

```ini
# Microsoft Graph — app-only credentials
AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_SECRET=replace_with_real_secret_value
# Optional override:
# AZURE_API_URL=https://graph.microsoft.com/v1.0
```

### Optional environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string for the Prisma models (User, Preference, PublishedListing). Only required if you run `prisma migrate` or query those models. |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Required only if you wire up the `[...nextauth]` route for user sign-in. |

### Creating the Microsoft Entra app registration

The Message Center calls Microsoft Graph with the **application** permission `ServiceMessage.Read.All` (admin-consented, app-only — no user is signed in).

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) as an admin of the tenant whose Message Center you want to surface.
2. **Identity → Applications → App registrations → New registration.** Name it (e.g. `Pulse 360 - Message Center Reader`). Account type: **Single tenant**. Leave redirect URI blank.
3. Copy **Application (client) ID** → `AZURE_CLIENT_ID`.
4. Copy **Directory (tenant) ID** → `AZURE_TENANT_ID`.
5. **Certificates & secrets → New client secret.** Copy the **Value** (you cannot see it again) → `AZURE_CLIENT_SECRET`.
6. **API permissions → Add a permission → Microsoft Graph → Application permissions → `ServiceMessage.Read.All` → Add.**
7. **Grant admin consent** for the directory. Without this, the token request will succeed but Graph will return `403`.

You should now be able to start the app and load `/message-center` with live tenant messages.

### Database (Prisma)

Prisma is included for future user-preference / published-listing features. None of the live pages require Postgres today.

If you want to enable it:

```bash
# 1. Set DATABASE_URL in .env.local
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/pulse360?schema=public"' >> .env.local

# 2. Generate the client (writes to src/generated/prisma)
npx prisma generate

# 3. Push schema to a fresh dev DB
npx prisma db push

# 4. (Optional) Open Prisma Studio
npx prisma studio
```

The generated client is **not** committed (`/src/generated/prisma` is in `.gitignore`).

---

## Running the app

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js with Turbopack on port 3000 |
| `npm run build` | Production build (runs `next build`) |
| `npm start` | Serve the production build |
| `npm run clean` | Delete `.next/` |
| `npm run lint` | ESLint over the whole repo |
| `npm run lint:fix` | ESLint with autofix |
| `npm run type-check` | `tsc --noEmit` (no emit, types only) |
| `npm run format` | Prettier over the whole repo |
| `npx playwright test` | Run Playwright tests across Chromium, Firefox, WebKit |

---

## Routes reference

### Pages

| Path | Purpose |
|---|---|
| `/` | Redirects to `/home` |
| `/home` | Landing dashboard |
| `/about` | About / contact |
| `/message-center` | M365 Message Center list (search, filter, badges, impact pills) |
| `/message/[id]` | Message detail |
| `/m365-updates` | M365 update feed |
| `/m365-update/[id]` | M365 update detail |
| `/azure-updates` | Azure update feed |
| `/azure-update/[id]` | Azure update detail |
| `/fabric-roadmap` | Fabric + Power Platform roadmap (grouped, collapsible) |
| `/fabric-roadmap/[id]` | Roadmap item detail |
| `/release-plans` | Hub page |
| `/release-plans/azure` | Azure release planner |
| `/release-plans/m365` | M365 release planner |
| `/release-plans/fabric` | Fabric release planner |
| `/release-plans/dynamics-power` | Dynamics 365 + Power Platform release planner |
| `/release-plans/roadmap` | Combined roadmap view |
| `/release-plan/[id]` | Release plan item detail |
| `/msrc` | MSRC CVE list with month picker |
| `/msrc/blog` | MSRC blog feed |
| `/security` | Security overview |
| `/product-news` | Aggregated product news hub |
| `/product-news/all-things-azure` | All Things Azure |
| `/product-news/author` | Microsoft news authors index |
| `/product-news/azure-ai-foundry` | Azure AI Foundry blog |
| `/product-news/azure-ai-ml` | Azure AI / ML blog |
| `/product-news/copilot` | Copilot news |
| `/product-news/copilot-studio` | Copilot Studio release plan |
| `/product-news/fabric-blog` | Microsoft Fabric blog |
| `/product-news/learn-blog` | Microsoft Learn blog |
| `/product-news/microsoft-news` | Microsoft news |
| `/product-news/power-automate` | Power Automate blog |
| `/product-news/power-bi` | Power BI blog |
| `/product-news/power-platform` | Power Platform blog |
| `/product-news/semantic-kernel` | Semantic Kernel blog |
| `/product-news/tech-community` | Tech Community |
| `/product-news/vscode` | VS Code blog |
| `/product-news/windows` | Windows blog |
| `/powerplatd365` | Power Platform / D365 landing |
| `/map`, `/test-map` | Experimental map-based visualizations |

### API routes

All under `/api/*`. None are mutating; every handler is `GET`.

| Route | Upstream / behavior |
|---|---|
| `/api/messages` | Wraps `getMessages()` → Microsoft Graph; returns 500 on upstream failure |
| `/api/msrc?monthId=YYYY-Mmm` | Proxies MSRC CVRF months list or a specific month; validates `monthId` strictly |
| `/api/proxy-rss?url=https://...` | Allowlisted RSS proxy (microsoft.com hosts only); rejects non-https, unknown hosts, and follows manual redirects |
| `/api/azure-ai-foundry-news` | DevBlogs RSS for Azure AI Foundry |
| `/api/azure-ai-ml-news` | DevBlogs / AI feed |
| `/api/copilot-news` | Copilot feed |
| `/api/copilot-studio-news` | Scrapes the Learn.microsoft.com release plan table |
| `/api/fabric-blog-news` | Fabric blog RSS |
| `/api/learn-blog-news` | Learn blog RSS |
| `/api/microsoft-news` | Aggregated Microsoft news feed |
| `/api/microsoft-news-authors` | Author index |
| `/api/power-apps-news`, `/api/power-automate-news`, `/api/power-bi-news`, `/api/power-platform-news` | Per-product blog RSS |
| `/api/semantic-kernel-news` | Semantic Kernel feed |
| `/api/tech-community-news` | Tech Community feed |
| `/api/auth/[...nextauth]` | NextAuth catch-all (scaffolded; add `route.ts` if you wire up user sign-in) |

---

## Using the site

- **Global search.** Every list page has a search bar. Matching is case- and whitespace-insensitive against title, product name, and (where applicable) message ID.
- **Filters.** Product, Area, Date, and Major Changes filters live above each list. Active filters pulse red so it's obvious when results are scoped. Click **Clear** to reset.
- **Drill-through.** Every card is fully clickable. Detail pages preserve the product tab and impact context.
- **MSRC month picker.** `/msrc` exposes a dropdown of every month MSRC has published a CVRF report for. Pick a month → the page re-fetches the per-month CVE bundle. Each CVE expands to show product, max severity, KB article links, downloads, weakness (CWE), and revision history.
- **Theme.** Use the toggle in the top-right to switch light / dark / system.
- **Keyboard nav.** Top-level nav, popovers, and cards are reachable by `Tab`. `Esc` closes popovers and modals.

---

## Testing

Playwright is configured for three browser projects (Chromium, Firefox, WebKit) and runs tests in parallel.

```bash
npx playwright install      # one-time browser binaries
npx playwright test         # all browsers, all tests
npx playwright test --ui    # interactive mode
npx playwright show-report  # last HTML report
```

Specs live in `tests/`. The starter `tests/example.spec.ts` is a placeholder — add real coverage as features stabilize. The Playwright config does **not** auto-start `next dev`; either run `npm run dev` first, or uncomment the `webServer` block in `playwright.config.ts`.

---

## Linting, formatting, and type checks

```bash
npm run lint           # ESLint (flat config in eslint.config.mjs)
npm run lint:fix       # ESLint with autofix
npm run type-check     # tsc --noEmit
npm run format         # Prettier write
```

The ESLint config covers TypeScript, React, Next.js, JSON, CSS, and Markdown files. A pre-commit hook is **not** wired up; add one (e.g. `husky` + `lint-staged`) if your workflow needs it.

---

## Deployment

Pulse 360° is built for Vercel but runs anywhere Node 20.17+ can host Next.js 16.

**Vercel (recommended):**

1. Import the repo in Vercel → **New Project**.
2. Framework preset: **Next.js** (auto-detected).
3. Add the env vars under **Settings → Environment Variables** (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`, plus `DATABASE_URL` only if you use Prisma).
4. Deploy. The production domain in use is <https://www.mspulse360.app>.

**Self-host:**

```bash
npm ci
npm run build
npm start   # serves on port 3000
```

Put it behind a reverse proxy (Caddy / nginx / CloudFront) with HTTPS terminated upstream. Set `NODE_ENV=production`.

**Notes:**

- The site never persists Graph tokens — each request acquires a fresh access token via the client credentials flow.
- Vercel's default 4.5 MB serverless response cap can clip the largest Graph pages; if you see truncated Message Center results, deploy to a Node runtime with a higher cap or move that route to an Edge Function with streaming.
- `next.config.js` whitelists images from `devblogs.microsoft.com` and `winblogs.thesourcemediaassets.com`. Add hosts here if you embed images from new sources.

---

## Security notes

- **Secrets stay server-side.** All Graph credentials are read in `src/lib/api.server.ts` (marked `server-only`) and never bundled into client code.
- **`.env*` is gitignored** by a broad rule that catches typos like `..env`. Always use a placeholder template (never real values) and never commit secrets. If you suspect a secret was committed, rotate the Entra client secret immediately.
- **RSS proxy is allowlisted.** `/api/proxy-rss` only fetches HTTPS URLs whose hostname is in a fixed `*.microsoft.com` set. Redirects are read manually (`redirect: 'manual'`) to prevent the proxy from being used to reach arbitrary hosts.
- **MSRC input is validated.** `/api/msrc?monthId=...` rejects anything not matching `^\d{4}-[A-Za-z]{3}$` before forwarding to MSRC, preventing path injection.
- **HTML from feeds is sanitized** with `isomorphic-dompurify` before render to mitigate stored XSS from upstream feeds.
- **CSP for SVG images.** `next.config.js` enables inline SVG (`dangerouslyAllowSVG: true`) but pairs it with a strict CSP (`script-src 'none'; sandbox;`) and `Content-Disposition: attachment` to neutralize active content.
- **Console silencing in production** prevents accidental disclosure of upstream payloads via host log aggregation.

If you find a security issue, please email the maintainer (see [Contact](#contact)) rather than opening a public issue.

---

## Troubleshooting

**"Missing required environment variables: AZURE_CLIENT_ID, ..." at dev start.**
You're in dev mode without Graph creds. Either set them in `.env.local` and restart, or set `NODE_ENV=production` if you intentionally want the app to boot with the Message Center disabled.

**`/message-center` is empty in production.**
The Graph token request failed silently. Check Vercel function logs. Common causes:

- `AZURE_CLIENT_SECRET` expired — generate a new one in Entra and update the env var.
- Admin consent for `ServiceMessage.Read.All` was never granted.
- Wrong tenant ID.

**MSRC page shows "Failed to fetch CVEs for month".**
The MSRC API occasionally rate-limits or 502s. Refresh; the route surfaces the upstream status.

**Product News page is empty.**
The upstream RSS feed may be temporarily down. Each handler returns 200 with an empty array on failure rather than crashing — refresh later, or check the route directly (e.g. `curl http://localhost:3000/api/fabric-blog-news`).

**Hydration mismatch warnings.**
The `<html>` element is rendered with `className="dark"` server-side but the theme provider may switch it client-side. `suppressHydrationWarning` is set on both `<html>` and `<body>` in `src/app/layout.tsx`; if you see new warnings, check that any new client component reading `theme` is wrapped in a `useEffect` mount guard.

**Prisma "Cannot find module '../generated/prisma'".**
Run `npx prisma generate`. The generated client is gitignored.

**Playwright fails with "browserType.launch: Executable doesn't exist".**
Run `npx playwright install` once to download browser binaries.

---

## Contributing

Issues and PRs welcome. Before opening a PR:

1. Run `npm run lint && npm run type-check`.
2. If you add or change a route, update **Routes reference** above.
3. If you add a new upstream host (RSS or image), add it to the allowlist in `/api/proxy-rss` *and* `next.config.js` `images.remotePatterns` as appropriate.
4. Keep components server-rendered by default; only opt into `'use client'` when you need state, effects, or browser APIs.
5. Do not commit real env values, generated Prisma clients, `.next/`, or `playwright-report/` — they're already gitignored.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contact

- **Author:** Russ Rimmerman
- **Role:** Microsoft Cloud Solution Architect
- **Email:** russ.rimmerman@microsoft.com
- **LinkedIn:** <https://www.linkedin.com/in/russrimm>
- **GitHub:** <https://github.com/russrimm>
- **Live site:** <https://www.mspulse360.app>
