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

```mermaid
flowchart TD
    subgraph Browser
        A[React Server Components + Client Islands]
    end

    subgraph Azure Static Web Apps
        B[Next.js 16 App Router]
        B1["/api/messages — Graph proxy"]
        B2["/api/proxy-rss — RSS proxy"]
        B3["/api/msrc — MSRC proxy"]
    end

    subgraph Azure API Management
        C[APIM Policy:<br/>Token acquisition via<br/>client credentials flow]
    end

    subgraph Microsoft APIs
        D[Microsoft Graph API<br/>/v1.0 and /beta]
        E[MSRC CVRF API]
        F[*.microsoft.com RSS feeds]
    end

    A -->|fetch /api/*| B
    B --> B1 & B2 & B3
    B1 -->|No auth header — APIM handles it| C
    C -->|Bearer token injected by policy| D
    B3 -->|Public, validated monthId| E
    B2 -->|Allowlisted hosts only| F
```

**Key design choices:**

- **APIM as auth gateway.** In production, `AZURE_API_URL` points to an Azure API Management instance. APIM's inbound policy acquires an OAuth token via client credentials and injects `Authorization: Bearer <token>` before forwarding to Graph. The app never handles Graph secrets in production.
- **Version-agnostic base URL.** The app uses a `graphUrl(path, version)` helper that constructs `{APIM_HOST}/{version}{path}`. Both `/v1.0` and `/beta` are supported without config changes.
- **Server-first data fetching.** `src/lib/api.server.ts` is marked `server-only`. Secrets never reach the browser.
- **No client-side Microsoft Graph tokens.** The browser talks to `/api/messages`; the server proxies Graph via APIM.
- **Allowlist-secured RSS proxy.** `/api/proxy-rss` only fetches from a fixed list of `*.microsoft.com` hosts to prevent SSRF.
- **Strict MSRC input validation.** `/api/msrc?monthId=...` validates `monthId` against `^\d{4}-[A-Za-z]{3}$` before forwarding.
- **Caching.** Server fetches use Next.js `revalidate` hints (1 hour for news, 24 hours for individual messages). Pagination is capped at 10 pages × 500 items to avoid serverless timeouts.
- **Graceful degradation.** If an upstream fails, the UI shows an error banner with actionable detail rather than a blank page.

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
│   ├── hooks/useData.ts         # React Query wrappers
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

#### Production (APIM mode — recommended)

In production, the app delegates authentication to Azure API Management. Only one env var is needed:

| Variable | Required? | Purpose |
|---|---|---|
| `AZURE_API_URL` | **Yes** | APIM endpoint (e.g. `https://graphapirim.azure-api.net`). The app sends requests here; APIM handles token acquisition via its inbound policy. |

No secrets are stored in the web app. APIM uses Named Values (`graph-client-id`, `graph-client-secret`) to acquire tokens.

#### Local development (direct mode)

For local dev without APIM, the app acquires Graph tokens itself using client credentials:

| Variable | Required? | Purpose |
|---|---|---|
| `AZURE_CLIENT_ID` | Yes | Application (client) ID of the Entra app registration |
| `AZURE_TENANT_ID` | Yes | Directory (tenant) ID |
| `AZURE_CLIENT_SECRET` | Yes | Client secret value (treat as a password — rotate regularly) |
| `AZURE_API_URL` | No | Set to `https://graph.microsoft.com` for direct access. If omitted, defaults to `https://graph.microsoft.com`. |

Create `.env.local` (use placeholders — never commit real secrets):

```ini
# Microsoft Graph — app-only credentials (local dev only)
AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_TENANT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_SECRET=replace_with_real_secret_value

# Base URL — no version path suffix (supports both /v1.0 and /beta)
AZURE_API_URL=https://graph.microsoft.com
```

> **APIM mode detection:** When `AZURE_API_URL` points to a non-`graph.microsoft.com` host, the app assumes APIM handles authentication and skips local token acquisition. When it points to `graph.microsoft.com` (or is unset), the app acquires tokens itself using `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_CLIENT_SECRET`.

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

Pulse 360° runs on **Azure Static Web Apps** with an **Azure API Management** gateway for Graph API authentication.

```mermaid
flowchart LR
    subgraph Azure
        SWA[Static Web App<br/>Next.js 16 SSR]
        APIM[API Management<br/>Token injection policy]
        Graph[Microsoft Graph]
    end

    SWA -->|AZURE_API_URL| APIM
    APIM -->|Bearer token| Graph
```

**Azure Static Web Apps (current production):**

1. CI/CD via GitHub Actions (`.github/workflows/`).
2. Add `AZURE_API_URL=https://<your-apim>.azure-api.net` in **Configuration → Application settings**.
3. No other secrets are needed — APIM handles Graph authentication.
4. The production domain is <https://www.mspulse360.app>.

**APIM setup:**

1. Create an API in APIM with backend `https://graph.microsoft.com`.
2. Add Named Values: `graph-client-id` and `graph-client-secret` (use Key Vault references for the secret).
3. Apply the inbound policy that acquires a client_credentials token and sets the `Authorization` header. See the [APIM policy reference](docs/apim-policy.md) or the Architecture diagram above.
4. The policy supports both `/v1.0` and `/beta` paths — they're forwarded as-is.

**Self-host:**

```bash
npm ci
npm run build
npm start   # serves on port 3000
```

Put it behind a reverse proxy (Caddy / nginx / CloudFront) with HTTPS terminated upstream. Set `NODE_ENV=production` and `AZURE_API_URL`.

**Notes:**

- The site never stores Graph tokens — APIM acquires a fresh access token per request via the client credentials flow.
- Pagination is capped at 10 pages × 500 items to avoid serverless function timeouts.
- `next.config.js` whitelists images from `devblogs.microsoft.com` and `winblogs.thesourcemediaassets.com`. Add hosts here if you embed images from new sources.

---

## Security notes

- **Secrets stay server-side.** All Graph requests route through Azure API Management in production. The web app contains **no Graph credentials** — APIM Named Values (backed by Key Vault) hold the client secret.
- **APIM as a security boundary.** The app's server-side code calls APIM without an Authorization header. APIM's inbound policy acquires tokens internally and injects them before forwarding to Graph. Even if the web app is compromised, no Graph secret is exposed.
- **`.env*` is gitignored** by a broad rule that catches typos like `..env`. Always use a placeholder template (never real values) and never commit secrets. If you suspect a secret was committed, rotate the Entra client secret immediately.
- **RSS proxy is allowlisted.** `/api/proxy-rss` only fetches HTTPS URLs whose hostname is in a fixed `*.microsoft.com` set. Redirects are read manually (`redirect: 'manual'`) to prevent the proxy from being used to reach arbitrary hosts.
- **MSRC input is validated.** `/api/msrc?monthId=...` rejects anything not matching `^\d{4}-[A-Za-z]{3}$` before forwarding to MSRC, preventing path injection.
- **HTML from feeds is sanitized** with `isomorphic-dompurify` before render to mitigate stored XSS from upstream feeds.
- **CSP for SVG images.** `next.config.js` enables inline SVG (`dangerouslyAllowSVG: true`) but pairs it with a strict CSP (`script-src 'none'; sandbox;`) and `Content-Disposition: attachment` to neutralize active content.
- **Never use `NEXT_PUBLIC_` prefix for secrets.** Variables prefixed with `NEXT_PUBLIC_` are bundled into client JavaScript. Graph credentials must remain server-only.

If you find a security issue, please email the maintainer (see [Contact](#contact)) rather than opening a public issue.

---

## Troubleshooting

**"Missing required environment variables: AZURE_CLIENT_ID, ..." at dev start.**
You're in local dev mode (direct Graph access) without credentials. Either set them in `.env.local` and restart, or point `AZURE_API_URL` to your APIM instance instead.

**`/message-center` shows "Something went wrong" (500) in production.**
Check the API response at `/api/messages` for the upstream error. Common causes:

- APIM Named Value `graph-client-secret` is expired or empty — update it in APIM portal.
- Admin consent for `ServiceMessage.Read.All` was never granted on the app registration.
- The APIM inbound policy is returning a null token (check `tokenResponse` variable in APIM tracing).

**`InvalidAuthenticationToken: ArgumentNull` from Graph.**
The token sent to Graph is `null` or empty. If using APIM, this means the token acquisition in the APIM policy failed. Verify APIM Named Values and that the app registration's client secret hasn't expired.

**`/message-center` is empty in production.**
The Graph request succeeded but returned no messages. Verify the app registration has `ServiceMessage.Read.All` (Application) permission with admin consent on the correct tenant.

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
