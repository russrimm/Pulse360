# Copilot Instructions for Pulse360

## Build & Dev Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint (flat config: eslint.config.mjs)
npm run lint:fix     # ESLint with auto-fix
npm run type-check   # TypeScript type checking (tsc --noEmit)
npm run format       # Prettier
```

### Testing

Playwright is configured for E2E tests in `./tests/`:

```bash
npx playwright test                        # Run all tests
npx playwright test tests/example.spec.ts  # Run a single test file
npx playwright test --project=chromium     # Single browser
```

## Architecture

### Stack

- **Next.js 15 App Router** with React 19, TypeScript, Tailwind CSS v4
- **UI**: Shadcn UI + Radix UI primitives
- **State**: Zustand (`src/components/filterStore.ts`) for client-side filter state; React Server Components for data fetching
- **Database**: PostgreSQL via Prisma (schema at `prisma/schema.prisma`, generated client output to `src/generated/prisma`)
- **Auth**: next-auth
- **Deployment**: Azure Static Web Apps (CI/CD in `.github/workflows/`)

### Data Flow

The app aggregates Microsoft data from multiple sources:

- **Server-side** (`src/lib/api.server.ts`): Calls Microsoft Graph API through Azure API Management (APIM). In production (APIM mode), the app sends unauthenticated requests to APIM which handles token acquisition via Named Values. In local dev, the app can acquire tokens directly using `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`. Imports `'server-only'` to enforce server boundary.
- **Client-side** (`src/lib/api.client.ts`): Fetches from internal Next.js API routes (`/api/*`) that proxy and parse RSS/XML feeds.
- **API routes** (`src/app/api/`): ~20 route handlers for proxying Microsoft RSS feeds (product news, blog feeds), MSRC security data, and message center data.
- **APIM mode detection**: When `AZURE_API_URL` points to a non-`graph.microsoft.com` host, the app skips local token acquisition (APIM handles auth). A `graphUrl(path, version)` helper builds URLs supporting both `/v1.0` and `/beta`.
- **Pagination**: Graph API pagination is capped at 10 pages × 500 items to avoid serverless timeouts.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`). Always use `@/` imports.

### Key Directories

- `src/app/` — Next.js App Router pages. Each product area (message-center, fabric-roadmap, azure-updates, msrc, release-plans, product-news, m365-updates) has its own route with detail pages via `[id]` segments.
- `src/components/` — All React components (no subdirectory nesting). Contains both server and client components.
- `src/lib/` — Data fetching (`api.server.ts`, `api.client.ts`, `fabricApi.ts`), types (`types.ts`), and icon helpers.
- `src/types/` — Module declarations (SVG, xml2js).

## Conventions

- **Functional & declarative only** — no classes. Use `function` keyword for pure functions.
- **Prefer interfaces over types**; avoid enums (use maps).
- **Named exports** for components.
- **Directory naming**: lowercase with dashes (e.g., `product-news`).
- **Minimize `'use client'`** — favor React Server Components. Use `'use client'` only for small components needing Web APIs. Do not use it for data fetching.
- **Wrap client components in Suspense** with fallback.
- **Descriptive boolean variable names** with auxiliary verbs: `isLoading`, `hasError`, `showMajorChangesOnly`.
- **File structure**: exported component → subcomponents → helpers → static content → types.
- **images.remotePatterns** (not `images.domains`) in `next.config.js`.

## Environment Variables

### Production (APIM mode)

Only one env var is needed — APIM handles Graph auth:

- `AZURE_API_URL` — APIM endpoint (e.g. `https://graphapirim.azure-api.net`)

### Local development (direct mode)

- `AZURE_CLIENT_ID` — Entra app registration client ID
- `AZURE_TENANT_ID` — Directory (tenant) ID
- `AZURE_CLIENT_SECRET` — Client secret value
- `AZURE_API_URL` — Set to `https://graph.microsoft.com` (no version path)
- `DATABASE_URL` — PostgreSQL connection string for Prisma (optional)

## Strict TypeScript

The project uses strict TypeScript (`strict: true` plus individual strict flags). `noImplicitAny` and `strictNullChecks` are enforced — do not use `any` without good reason (`@typescript-eslint/no-explicit-any` is set to warn).
