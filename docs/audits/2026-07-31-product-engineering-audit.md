# Pulse 360 Product and Engineering Audit

**Audit date:** July 31, 2026
**Repository:** `russrimm/Pulse360`
**Branch:** `russrimm-bookish-meme`
**Implementation commit:** `8b57d17e5703ca143dcd1f06e36bdc56065c1fe2` (`Audit and harden product data flows`)
**Scope:** Product correctness, tenant privacy, feed reliability, SSRF/input validation, caching and pagination, stale-data behavior, Microsoft security data, lifecycle data, accessibility, responsive interaction, SEO, performance, dependencies, CI, tests, and deployment documentation.

## Executive summary

The audit prioritized misleading update data, tenant-specific Message Center exposure, destructive synchronization risks, broken Microsoft feeds, lifecycle accuracy, security-update usability, accessibility, and measurable runtime/dependency risk.

The implementation made Message Center fail closed in production unless access is explicitly configured, protected tenant responses from shared caching, hardened Graph synchronization and proxy endpoints, corrected stale or unstable feed behavior, repaired the lifecycle export pipeline, improved MSRC navigation and loading behavior, and delivered accessibility and performance improvements across shared UI components.

The production dependency audit improved from **1 critical, 9 high, and 10 moderate findings** to **0 critical, 2 high, and 1 moderate finding**. The remaining findings are transitive Prisma and ExcelJS dependency paths described under [Deferred recommendations](#deferred-recommendations).

No real credentials were used. No deployment, production database, Azure resource, Entra application, or other cloud resource was created or modified.

## Implemented changes

### 1. Message Center tenant privacy and access control

- Added `src/lib/message-center-auth.ts` to centralize Message Center access decisions.
- Production now fails closed when interactive authentication is not configured.
- Anonymous tenant-data publication requires the explicit `MESSAGE_CENTER_PUBLIC=true` override.
- Development remains usable without interactive authentication for local work.
- Configured authentication uses a dedicated single-tenant Entra application rather than the app-only Graph credentials.
- Removed the previous `common` tenant fallback from `src/lib/auth.ts`; `AUTH_AZURE_AD_TENANT_ID` is required when interactive authentication is enabled.
- Protected both `/message-center` and `/message/[id]` before tenant data is read.
- Marked Message Center pages dynamic and `noindex` so authenticated content is not statically generated or indexed.
- Added `private, no-store, max-age=0` and `Vary: Cookie` to `/api/messages` responses.
- Changed Message Center upstream failures to return a generic `503` response without leaking implementation details.
- Added explicit production configuration guidance to `.env.example` and `README.md` for:
  - `AUTH_AZURE_AD_CLIENT_ID`
  - `AUTH_AZURE_AD_CLIENT_SECRET`
  - `AUTH_AZURE_AD_TENANT_ID`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `MESSAGE_CENTER_PUBLIC`
  - `CRON_SECRET`

**Primary evidence:** `src/lib/message-center-auth.ts`, `src/lib/auth.ts`, `src/app/api/messages/route.ts`, `src/app/message-center/page.tsx`, `src/app/message/[id]/page.tsx`, `.env.example`, `README.md`.

### 2. Graph authentication, pagination, and synchronization safety

- Normalized `AZURE_API_URL` values, including bare hostnames and Graph URLs that already contain `/v1.0` or `/beta`.
- Restricted normalized API bases to HTTP(S) and removed query/fragment input.
- Added an in-process app-only Graph token cache with an expiry safety margin to avoid requesting a token for every Graph operation.
- Added a 10-second token-request timeout.
- Preserved APIM mode and its direct-Graph fallback when local credentials are also configured.
- Retained the 10-page Graph pagination cap but now throws if a continuation link remains after the cap. This prevents a partial dataset from being treated as complete.
- Added a destructive-sync guard: when Graph returns zero rows while active rows already exist, synchronization fails instead of archiving the entire active dataset.
- Parallelized the Graph fetch and active-row count used by that safety check.
- Kept stale persisted rows available when background synchronization fails.
- Added typed Graph and Microsoft 365 release payloads where this code was changed.

**Primary evidence:** `src/lib/api.server.ts` (token cache near lines 105-176, pagination guard near line 297, empty-result reconciliation guard near line 448).

### 3. Scheduled sync endpoint hardening

- Added constant-time comparison for the cron bearer secret with `node:crypto` `timingSafeEqual`.
- Kept production fail-closed behavior when `CRON_SECRET` is missing.
- Added private/no-store response headers.
- Replaced raw exception text in HTTP responses with `Message Center sync failed` while retaining server-side logging.

**Primary evidence:** `src/app/api/cron/sync-messages/route.ts`.

### 4. RSS and image proxy hardening

#### RSS proxy

- Preserved the explicit Microsoft-source hostname allowlist and HTTPS-only requirement.
- Added a maximum URL length.
- Continued to use `redirect: 'manual'` so redirects cannot bypass host validation.
- Added a 15-second upstream timeout.
- Added a Microsoft-compatible `User-Agent` and explicit RSS/XML `Accept` header.
- Added a 5 MB response limit using both `Content-Length` and actual UTF-8 body size.
- Added public edge caching with stale-while-revalidate.
- Added XML CSP sandboxing and `X-Content-Type-Options: nosniff`.
- Returned `502` for upstream failures instead of presenting them as internal application failures.

#### Image proxy

- Preserved the Microsoft/CDN hostname allowlist and private/loopback literal-address checks.
- Added a 4,096-character URL limit.
- Preserved manual redirect handling and the 10-second timeout.
- Restricted accepted media types to known image MIME types.
- Added a 10 MB limit checked through both `Content-Length` and a bounded streaming transform.
- Added CSP sandboxing and `nosniff` to proxied images, including SVG.

**Primary evidence:** `src/app/api/proxy-rss/route.ts`, `src/app/api/image-proxy/route.ts`, `src/lib/feed/upstream.ts`.

### 5. Feed correctness and source reliability

- Added `src/lib/feed/upstream.ts` as a shared resilient Microsoft feed fetcher with timeout, caching, request headers, and safe response headers.
- Added `src/lib/feed/sources.ts` to centralize the current Copilot Studio release-wave source.
- Updated Copilot Studio from the stale 2024 Wave 2 page to the validated **2026 Wave 1** release-plan page.
- Removed the fabricated current timestamp from Copilot Studio features. Planned features no longer appear newly published every time the page is loaded.
- Replaced positional Copilot Studio IDs with deterministic IDs based on source links and feature slugs.
- Replaced redirecting or bot-blocked Fabric and Power BI URLs with their working canonical community RSS endpoints:
  - Fabric updates: `fbc_fabricupdatesblogs`
  - Power BI updates: `fbc_pbiupdatesblog`
- Added the user agent required for those upstreams to respond successfully.
- Reworked Fabric feed parsing to use typed unknown-value guards and deterministic IDs rather than array indexes.
- Removed timestamp-based Azure AI identifiers.
- Stopped substituting the current time when Azure AI items have no valid publication date.
- Normalized Azure AI GUID objects to stable strings.
- Added typed RSS parsing helpers in `src/lib/api.client.ts` and removed redundant try/catch wrappers in changed paths.
- Changed affected route failures to explicit upstream `502` responses rather than success-shaped empty payloads.

**Primary evidence:** `src/lib/feed/sources.ts`, `src/lib/feed/upstream.ts`, `src/app/api/copilot-studio-news/route.ts`, `src/app/api/fabric-blog-news/route.ts`, `src/app/api/power-bi-news/route.ts`, `src/app/api/azure-ai-ml-news/route.ts`, `src/lib/api.client.ts`.

### 6. Microsoft Lifecycle data integrity and stale-data handling

- Repaired `scripts/update-lifecycle-data.mjs`, whose output schema did not match the route/UI schema.
- The scheduled exporter now emits schema version 2 with:
  - `edition`
  - `release`
  - `supportPolicy`
  - `mainStreamEndDate`
  - `extendedEndDate`
  - `retirementDate`
  - `releaseStartDate`
  - `releaseEndDate`
  - `docsUrl`
  - `endOfSupportDate`
- Added dynamic header detection failure handling and a required product-column check.
- Invalid date strings now normalize to `null` instead of being passed through as misleading date values.
- Preserved compatibility with the previous `version` field while moving to `release`.
- Added persisted-cache timestamp validation.
- Added an 8-day stale threshold and surfaced stale status from both file and memory caches.
- Added a visible stale-data warning in the lifecycle UI.
- Dynamically imports ExcelJS only when the committed JSON file cannot serve the request, reducing normal route startup and bundle tracing work.
- Refreshed `public/data/lifecycle.json` from the official Microsoft export.
- The refreshed file contains **2,942 lifecycle rows** and schema version 2.
- Changed lifecycle API failures to generic `503` responses while logging the underlying server error.

**Primary evidence:** `scripts/update-lifecycle-data.mjs`, `src/app/api/mslifecycle/route.ts`, `src/components/MsLifecycleClient.tsx`, `public/data/lifecycle.json`.

### 7. Microsoft Security Response Center accuracy and UX

- Tightened `monthId` validation to real three-letter month abbreviations.
- Added 15-second MSRC request timeouts.
- Added 15-minute CVRF caching and one-hour update-list caching with stale-while-revalidate response headers.
- Converted upstream failures to `502` with generic client messages.
- Added typed runtime validation for the update-month list.
- Split month-list loading from selected-month CVRF loading to avoid repeatedly refetching the month list.
- Added `AbortController` cancellation for both request types.
- Added explicit loading state rather than treating an empty vulnerability array as loading forever.
- Added a distinct empty state when a month legitimately has no published vulnerabilities.
- Kept the selected month in the URL with `router.replace`, making month selection shareable and restorable.
- Validated a requested URL month against the available month list before using it.
- Added visible attribution and a direct link to the Microsoft Security Update Guide.
- Replaced array-index CVE keys with stable vulnerability/CVE identifiers.
- Added accessible labels and error/status announcements.

**Primary evidence:** `src/app/api/msrc/route.ts`, `src/app/msrc/page.tsx`.

### 8. Search, filtering, and pagination UX

- Added a visible Message Center search field that searches titles and message content.
- Added `useDeferredValue` so filtering large persisted Message Center datasets does not block typing.
- Added an `aria-live` result count and a pending-results announcement.
- Made custom date-range endpoints inclusive with `isWithinInterval`.
- Reset pagination when any search/filter value changes.
- Kept Message Center rendering bounded to 12 items per page even while filters are active, avoiding an unbounded filtered render.
- Retained intersection-observer loading and added a keyboard-accessible **Load more** button as a deterministic fallback.
- Added an explicit no-results state.
- Removed duplicate imperative router navigation from Message Center cards; the card link is now the single navigation mechanism and supports standard browser link behavior.
- Reworked the shared `SearchBar` to handle controlled and uncontrolled usage correctly.
- Added labels, names, `type="search"`, `autocomplete="off"`, accessible clear controls, improved placeholders, and visible focus styles.

**Primary evidence:** `src/components/MessageList.tsx`, `src/components/MessageCard.tsx`, `src/components/SearchBar.tsx`.

### 9. Accessibility and interface-guideline improvements

- Added a keyboard-visible **Skip to main content** link and matching `main-content` target.
- Removed the forced initial dark class so system theme selection works correctly.
- Updated the theme toggle to use `resolvedTheme`, reserve layout space before hydration, provide a specific action label, and expose a 40x40 target.
- Added navigation labels, icon-link labels, decorative icon treatment, and focus-visible rings in the navbar.
- Rebuilt Product News cards around semantic `article`, heading, anchor, and `time` elements rather than clickable `div` behavior.
- Removed the client-side author-title network request from every Product News card.
- Avoided displaying an invented date when publication data is absent.
- Added empty-content handling and stable external-link labels.
- Improved the image modal with `role="dialog"`, `aria-modal`, initial focus, Escape handling, background-scroll locking, focus restoration, and backdrop-only dismissal.
- Added status semantics and reduced-motion handling to loading indicators.
- Added alert semantics to Message Center errors.
- Replaced changed `transition-all` usage with explicit transition properties and added reduced-motion variants where relevant.

**Primary evidence:** `src/app/layout.tsx`, `src/components/Navbar.tsx`, `src/components/ThemeToggle.tsx`, `src/components/ProductNewsCard.tsx`, `src/components/ImageModal.tsx`, `src/components/LoadingSpinner.tsx`, `src/components/MessageCenterClient.tsx`.

### 10. React and network performance

- Removed root-level React Query and filter providers so unrelated routes no longer inherit those client boundaries.
- Scoped React Query to Product News routes.
- Added five-minute query freshness, 30-minute garbage collection, and disabled refetch-on-window-focus for slowly changing Microsoft feeds.
- Removed the unused Zustand store and dependency.
- Removed dead imports and duplicate event navigation from Message Center cards.
- Deferred ExcelJS loading to the lifecycle live-fetch fallback path.
- Added Graph token reuse and shared feed request caching.
- Bounded long lists through Message Center pagination.

**Primary evidence:** `src/app/layout.tsx`, `src/app/product-news/layout.tsx`, `src/components/ReactQueryProvider.tsx`, deleted `src/components/filterStore.ts`, `src/app/api/mslifecycle/route.ts`, `src/lib/api.server.ts`.

### 11. Dependency health and package management

- Updated:
  - `next` to `^16.2.11`
  - `next-auth` to `^4.24.15`
  - `fast-xml-parser` to `^5.10.1`
- Added safe transitive overrides for `@hono/node-server`, `fast-uri`, and `valibot`.
- Added Prettier as the formatter script's declared development dependency.
- Removed unused runtime dependencies:
  - `@azure/msal-browser`
  - `@headlessui/react`
  - `@microsoft/agents-activity`
  - `@microsoft/agents-copilotstudio-client`
  - `node-fetch`
  - `react-icons`
  - `rss-parser`
  - `swiper`
  - `zustand`
- Removed obsolete type packages for node-fetch and react-icons.
- Removed `package-lock.json`; `pnpm-lock.yaml` is now the single lockfile for the declared pnpm project.
- Regenerated the pnpm lockfile.

**Primary evidence:** `package.json`, `pnpm-lock.yaml`, deleted `package-lock.json`.

### 12. CI, dependency automation, and deployment consistency

- Added `.github/workflows/quality.yml` to install with pnpm, generate Prisma, type-check, run sanitizer security tests, and build on pushes and pull requests.
- Added `.github/dependabot.yml` for npm and GitHub Actions updates with production/development dependency grouping.
- Updated the Azure Static Web Apps workflow to install pnpm, cache pnpm packages, and run `pnpm build` rather than npm.
- Documented secure Message Center deployment behavior in README and `.env.example`.

**Primary evidence:** `.github/workflows/quality.yml`, `.github/dependabot.yml`, `.github/workflows/azure-static-web-apps-purple-river-045b0790f.yml`, `README.md`, `.env.example`.

## Changed-file inventory

| File                                                                 | Change                                                                                       |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `.env.example`                                                       | Added secure interactive auth, explicit public-mode, and cron-secret configuration guidance. |
| `.github/dependabot.yml`                                             | Added npm and GitHub Actions dependency update automation.                                   |
| `.github/workflows/azure-static-web-apps-purple-river-045b0790f.yml` | Standardized deployment builds on pnpm.                                                      |
| `.github/workflows/quality.yml`                                      | Added type-check, sanitizer tests, and production-build CI.                                  |
| `README.md`                                                          | Documented production Message Center privacy and configuration requirements.                 |
| `package-lock.json`                                                  | Removed obsolete secondary lockfile.                                                         |
| `package.json`                                                       | Patched vulnerable packages, removed unused dependencies, added Prettier and safe overrides. |
| `pnpm-lock.yaml`                                                     | Regenerated after dependency updates/removals/overrides.                                     |
| `public/data/lifecycle.json`                                         | Refreshed official lifecycle dataset to schema v2 with 2,942 rows.                           |
| `scripts/update-lifecycle-data.mjs`                                  | Repaired lifecycle export schema and validation.                                             |
| `src/app/api/azure-ai-ml-news/route.ts`                              | Added stable IDs, valid-date handling, typed parsing, caching, and resilient fetch behavior. |
| `src/app/api/copilot-studio-news/route.ts`                           | Updated to the current release-plan source with timeout and safe response headers.           |
| `src/app/api/cron/sync-messages/route.ts`                            | Added constant-time auth, no-store headers, and generic failures.                            |
| `src/app/api/fabric-blog-news/route.ts`                              | Switched to canonical RSS and typed deterministic parsing.                                   |
| `src/app/api/image-proxy/route.ts`                                   | Added URL/MIME/body limits and response sandboxing.                                          |
| `src/app/api/messages/route.ts`                                      | Added access control, private caching, and generic 503 handling.                             |
| `src/app/api/mslifecycle/route.ts`                                   | Added schema compatibility, stale detection, dynamic ExcelJS import, and safe errors.        |
| `src/app/api/msrc/route.ts`                                          | Added strict validation, timeouts, caching, and safe upstream errors.                        |
| `src/app/api/power-bi-news/route.ts`                                 | Switched to the working canonical RSS endpoint.                                              |
| `src/app/api/proxy-rss/route.ts`                                     | Added host/URL/body controls, timeouts, caching, CSP, and no-sniff.                          |
| `src/app/layout.tsx`                                                 | Added SEO/share metadata and skip navigation; narrowed root client boundaries.               |
| `src/app/message-center/page.tsx`                                    | Added fail-closed access, dynamic/noindex rendering, and route-scoped filter provider.       |
| `src/app/message/[id]/page.tsx`                                      | Added fail-closed access, dynamic/noindex rendering, and cleaned async params handling.      |
| `src/app/msrc/page.tsx`                                              | Reworked fetching, URL state, source attribution, loading/error/empty UX, and types.         |
| `src/app/product-news/azure-ai-ml/page.tsx`                          | Switched card keys to stable feed IDs and improved loading/error output.                     |
| `src/app/product-news/layout.tsx`                                    | Scoped React Query to Product News.                                                          |
| `src/components/ImageModal.tsx`                                      | Added accessible dialog/focus/scroll behavior.                                               |
| `src/components/LoadingSpinner.tsx`                                  | Added status semantics and reduced-motion support.                                           |
| `src/components/MessageCard.tsx`                                     | Removed dead bundle code and duplicate navigation; improved focus/motion behavior.           |
| `src/components/MessageCenterClient.tsx`                             | Improved loading and error announcements.                                                    |
| `src/components/MessageList.tsx`                                     | Added deferred search, bounded pagination, inclusive dates, live counts, and empty state.    |
| `src/components/MsLifecycleClient.tsx`                               | Added stale-data warning and related lifecycle response support.                             |
| `src/components/Navbar.tsx`                                          | Improved semantics, labels, targets, and focus states.                                       |
| `src/components/ProductNewsCard.tsx`                                 | Rebuilt semantic card behavior; removed per-card author fetch and invented dates.            |
| `src/components/ReactQueryProvider.tsx`                              | Added feed-appropriate query defaults.                                                       |
| `src/components/SearchBar.tsx`                                       | Fixed controlled behavior and added accessible form semantics.                               |
| `src/components/ThemeToggle.tsx`                                     | Fixed system-theme behavior, hydration layout, labels, and target size.                      |
| `src/components/filterStore.ts`                                      | Removed unused Zustand implementation.                                                       |
| `src/lib/api.client.ts`                                              | Added typed RSS helpers and corrected Copilot Studio IDs/dates/source labels.                |
| `src/lib/api.server.ts`                                              | Added Graph URL normalization, token caching, sync safety, and typed payloads.               |
| `src/lib/auth.ts`                                                    | Required explicit tenant configuration and removed unsafe assertions/common fallback.        |
| `src/lib/feed/sources.ts`                                            | Added centralized current release-plan constants.                                            |
| `src/lib/feed/upstream.ts`                                           | Added shared resilient feed fetching and safe response headers.                              |
| `src/lib/message-center-auth.ts`                                     | Added centralized fail-closed tenant-data access policy.                                     |

## Validation results

| Validation                                                      | Exact result                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm type-check`                                               | Passed with exit code 0.                                                                               |
| Changed-source ESLint                                           | Passed with exit code 0 for every added or modified TS/TSX/MJS file.                                   |
| `pnpm exec playwright test sanitize.spec.ts --project=chromium` | **11 passed** in the final run.                                                                        |
| `node scripts/update-lifecycle-data.mjs`                        | Successfully fetched the official XLSX and parsed **2,942** entries.                                   |
| `pnpm build`                                                    | Passed on **Next.js 16.2.11**; compilation and TypeScript succeeded; **55/55** static pages generated. |
| Fabric feed smoke test                                          | HTTP **200** from the final canonical route.                                                           |
| Power BI feed smoke test                                        | HTTP **200** from the final canonical route.                                                           |
| Copilot Studio feed smoke test                                  | HTTP **200**.                                                                                          |
| Azure AI feed smoke test                                        | Returned 10 items; first item had a stable string GUID.                                                |
| Lifecycle API smoke test                                        | Returned **2,942 rows**, `stale=false`, source `file`.                                                 |
| Production Message Center without auth configuration            | HTTP **503**, confirming fail-closed behavior.                                                         |
| Cron endpoint without `CRON_SECRET`                             | HTTP **503**, confirming fail-closed behavior.                                                         |
| Invalid MSRC `monthId`                                          | HTTP **400**.                                                                                          |
| Disallowed image-proxy host                                     | HTTP **400**.                                                                                          |
| HTTP URL supplied to RSS proxy                                  | HTTP **400**.                                                                                          |
| Production dependency audit before remediation                  | 1 critical, 9 high, 10 moderate.                                                                       |
| Production dependency audit after remediation                   | 0 critical, 2 high, 1 moderate.                                                                        |
| `git diff --check` before commit                                | Passed.                                                                                                |
| Final implementation commit                                     | `8b57d17e5703ca143dcd1f06e36bdc56065c1fe2`.                                                            |

## Deferred recommendations

### P0 - Configure production tenant access before enabling Message Center

Configure `DATABASE_URL`, Graph credentials or APIM, the dedicated interactive Entra application, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `CRON_SECRET`. Keep `MESSAGE_CENTER_PUBLIC` unset/false unless publishing tenant administrator communications is an explicit product decision.

**Evidence:** `.env.example:30-52`, `README.md:448-471`, `src/lib/message-center-auth.ts`.

### P1 - Resolve remaining transitive dependency advisories

The final production audit has no critical findings. Remaining findings are:

- **2 high findings** associated with vulnerable `brace-expansion` paths under ExcelJS/archiver.
- **1 moderate finding** in the Prisma development chain through `@hono/node-server`.

A safe direct upgrade was not available through the configured Microsoft package feed for the Prisma package set used by this repository. Avoid broad transitive major-version forcing without validating Prisma generation, migrations, Excel parsing, and deployment packaging.

**Evidence:** `package.json:22-35`, `package.json:78-82`, `pnpm-lock.yaml` entries for Prisma, ExcelJS, Hono, and brace-expansion.

### P1 - Pay down the existing full-repository lint baseline

Changed source files pass ESLint, but `pnpm lint -- --quiet` still reports **144 pre-existing errors** in untouched legacy source, Markdown, Tailwind CSS, and declarations. Address these in focused cleanup changes so CI can eventually enforce full-repository linting.

Representative areas include legacy unused imports/state, explicit `any` in `CVECard.tsx` and older feed pages, Markdown fenced-code languages, Tailwind at-rule parsing, and CSS baseline/no-important rules.

**Evidence:** `eslint.config.mjs:34-57` and the existing files reported by the full lint run.

### P1 - Add distributed rate limiting and centralized observability

Public feed/proxy endpoints have input, timeout, host, and body controls but no distributed request-rate enforcement. In-memory limiting would be misleading on serverless multi-instance hosting. Select a deployment-supported shared limiter and telemetry destination before implementation.

Recommended signals include upstream latency/status by source, Graph pages/items per sync, sync age and archive counts, stale lifecycle age, proxy rejection reason, and user-visible feed empty/error rates.

**Evidence:** `src/app/api/proxy-rss/route.ts`, `src/app/api/image-proxy/route.ts`, `src/app/api/cron/sync-messages/route.ts`.

### P2 - Make Playwright server configuration portable

Several browser tests hard-code `http://localhost:3000`, while the Playwright `webServer` and `baseURL` configuration are disabled. Enable a managed test server and use `baseURL` so tests can run reliably when port 3000 is occupied.

**Evidence:** `tests/feed-pages.spec.ts:16`, `tests/ms-lifecycle.spec.ts:42,107,135`, `playwright.config.ts:28-29,76`.

### P2 - Define bookmark, alert, and export product requirements

The repository has a generic `Preference` model but no dedicated bookmark, alert subscription, delivery schedule, export history, or tenant/user ownership model. Implementing these without requirements would risk storing tenant content incorrectly or choosing an unsupported delivery service.

Define identity scope, retention, tenant isolation, notification channels, export formats, and authorization before implementation.

**Evidence:** `prisma/schema.prisma:16-31`.

### P2 - Continue route metadata and URL-state coverage

Root metadata and product-news metadata are improved, and Message Center is intentionally noindex. Additional public detail routes can receive canonical/Open Graph metadata after public deployment URLs and desired indexability are confirmed. Other complex filter pages can progressively move state into query parameters for shareability.

**Evidence:** `src/app/layout.tsx`, route metadata files, current client-side filter implementations.

## Blockers and constraints

- No real Graph, Entra, NextAuth, APIM, Postgres, or cron credentials were used, so authenticated tenant-data and live database behavior could not be exercised end-to-end.
- No production or cloud resource changes were authorized or performed.
- Another local process occupied port 3000 during the audit. The browser suites hard-code that port, so the complete browser suite could not be run against the audited server. Targeted sanitizer tests and production route smoke tests were run successfully on port 3100.
- The configured Microsoft package feed did not expose a compatible stable Prisma upgrade that resolved the remaining Prisma transitive advisory. The repository's Prisma package versions are also not fully uniform (`@prisma/adapter-pg` is a 7.9 development build while generated client tooling resolved to 7.8), so a coordinated Prisma upgrade requires separate validation.
- Full-repository lint is blocked by the 144 pre-existing errors described above; all changed source files pass.
- Distributed rate limiting, external alert delivery, and centralized observability require explicit infrastructure/product choices and were intentionally not implemented speculatively.

## Commit record

```text
8b57d17e5703ca143dcd1f06e36bdc56065c1fe2
Audit and harden product data flows
```

The commit includes the required Copilot co-author and session trailers. The worktree was clean after the implementation commit.
