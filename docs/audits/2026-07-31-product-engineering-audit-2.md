# Pulse 360 Product and Engineering Audit - Revision 2

**Audit date:** July 31, 2026  
**Repository:** `russrimm/Pulse360`  
**Branch:** `russrimm-pulse360-deep-audit`  
**Target branch:** `main`  
**Pull request:** `#157`  
**Baseline commit:** `4d594a71ab58134f64c472cb995b3c8043187126`

## Delivery record

The product and engineering audit was implemented, reviewed, validated, documented, pushed, and opened as a pull request in three commits:

| Commit                                     | Purpose                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `7875b0d4da6fd3d4c40e2c0733cdd22849d98c33` | Correct data accuracy, restore workflows, harden proxy boundaries, improve resilience and caching, add route/SEO support, and establish quality gates. |
| `6f09b6e22ed6d74afdb9ed6f4a471116f0c3acff` | Restore Prettier tooling, add request-deduplicated detail metadata, and resolve focused accessibility and rendering findings.                          |
| `54f5b96dbe9e2e89894c653e1e72fb7684f554f2` | Add the original durable audit record at `docs/audits/2026-07-31-product-engineering-audit.md`.                                                        |

This revision documents the complete cumulative change set without replacing the original audit file.

## Audit scope

The audit examined:

- Feed correctness, identity, deduplication, date normalization, error states, staleness, and attribution.
- MSRC/CVE severity, impact, products, links, and CVRF schema handling.
- Microsoft Graph authentication boundaries, tenant-data exposure, pagination, and persistence.
- SSRF and input validation for RSS, image, author, MSRC, lifecycle, and other proxy routes.
- API caching, upstream failure behavior, timeouts, and partial-data resilience.
- Prisma access and Message Center synchronization behavior.
- Search and filter workflows.
- Accessibility and responsive interaction behavior.
- SEO, canonical URLs, crawlability, and social sharing metadata.
- React Server/Client boundaries, waterfalls, rendering, bundle, and network performance.
- Tests, CI, linting, dependencies, formatter tooling, and repository hygiene.

No credentials were used. No deployment, cloud-resource mutation, or cloud-setting change was performed.

## Changes implemented

### MSRC and CVE accuracy

The MSRC CVRF response uses numeric threat types:

- Type `0` identifies impact.
- Type `3` identifies the MSRC severity rating.

The previous UI searched for string threat types and a nonexistent `Severity` property, then could display a numeric CVSS score as "Max Severity."

Changes:

- Added `src/lib/msrc.ts` for CVRF field normalization.
- Mapped impact and severity from the correct numeric threat records and `Description.Value`.
- Removed the CVSS-number-as-severity fallback.
- Simplified `src/components/CVECard.tsx` by deleting unused formatting and date code.
- Replaced the remaining raw Microsoft Graph product icon with `next/image`.
- Added regression tests for impact, severity, and invalid numeric severity fallback.

### Lifecycle calendar-date handling

Lifecycle dates are calendar dates, not instants. Parsing `YYYY-MM-DD` as UTC and comparing it with local midnight could mark products expired one day early in negative UTC offsets.

Changes:

- Added `src/lib/lifecycle.ts`.
- Parse date-only values in local calendar time.
- Centralized lifecycle status calculation.
- Updated `src/components/MsLifecycleClient.tsx` to use the shared helper.
- Added retirement-date boundary coverage.

### Feed identity and date normalization

`fast-xml-parser` returns an RSS GUID as:

- A plain string when it has no XML attributes.
- An object containing `#text` when it has attributes.

The previous client only handled the object form, which could discard stable GUIDs and fall back to mutable links.

Changes:

- Added `src/lib/feed/normalize.ts`.
- Preserve plain and attributed GUID values.
- Normalize invalid feed dates to timestamp `0` so malformed entries sort deterministically as oldest.
- Display "Date unavailable" instead of treating an invalid date as the current date.
- Updated all applicable parsers in `src/lib/api.client.ts`.

### Feed text and entity normalization

News cards previously decoded HTML entities through a client-side `<textarea>` and copied the results into state from an effect. That added a hydration render and triggered a React performance warning.

Changes:

- Added pure numeric/basic entity handling to `src/lib/feed/normalize.ts`.
- Added `src/lib/feed/text.ts`, which combines the existing sanitizer's full named-entity support with plain-text normalization.
- Updated `src/components/ProductNewsCard.tsx` to derive decoded title, author, and description during render.
- Preserved extended named entities such as `&mdash;` and `&eacute;`.
- Added named, decimal, and hexadecimal entity tests.

### Message Center search and initial rendering

The Message Center list had filtering logic but rendered no search input.

Changes:

- Added `src/lib/messageSearch.ts`.
- Rendered the shared `SearchBar` in `src/components/MessageList.tsx`.
- Search covers ID, title, content, summary, service, and tags.
- Added an explicit accessible search label.
- Moved Message Center loading to the Server Component page.
- Removed the obsolete `MessageCenterClient` client-fetch wrapper and initial waterfall.
- Added source text identifying Microsoft Graph Message Center for the configured tenant.
- Added the last successful synchronization time.
- Added a stale-data warning when no sync exists or the last successful sync is older than two hours.
- Added `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` to `/api/messages`.

The anonymous/public Message Center policy was deliberately preserved.

### Microsoft 365 detail performance

The primary Microsoft 365 detail page fetched the entire update collection and searched it for one ID, despite an existing single-item loader.

Changes:

- Replaced the full-feed lookup with `getM365Update(id)`.
- Reused that loader for the RSS alias route.
- Wrapped the loader with React `cache()` in each route module so `generateMetadata` and page rendering share one request-local result.

### Fabric roadmap caching, parsing, and partial failure

Fabric roadmap pages fan out across multiple product IDs. Requests were uncached, and verified Microsoft responses contained malformed JSON:

- Raw control characters in strings.
- Invalid markdown-style JSON escapes such as `\_`.

Changes:

- Centralized Fabric loading in `src/lib/fabricApi.ts`.
- Added one-hour Next.js fetch revalidation.
- Parse valid JSON normally before attempting repair.
- Repair raw control characters and invalid string escape prefixes without changing valid JSON escapes.
- Validate the resulting roadmap envelope.
- Reject unrecoverable or error-shaped responses.
- Batch product requests with `Promise.allSettled`.
- Preserve data from successful product areas when one source fails.
- Log failed product IDs and show a visible partial-data warning.
- Throw when all product sources fail.
- Avoid a false detail-page 404 when the lookup is incomplete because a source failed.
- Removed duplicate Fabric fetch code from the listing page.
- Added malformed-response, invalid-envelope, and partial-failure tests.

### Image-proxy SSRF boundary

The image proxy accepted broad suffixes including customer-provisionable Azure Storage/CDN and Akamai domains. That allowed attacker-hosted images to be proxied through the Pulse 360 origin.

Changes:

- Added `src/lib/imageProxySecurity.ts`.
- Removed broad `azureedge.net`, `windows.net`, and Akamai allowances.
- Retained only required Microsoft-controlled host families.
- Preserved HTTPS-only enforcement.
- Preserved private, loopback, and link-local literal rejection.
- Preserved manual redirect handling to prevent unchecked redirect bypass.
- Preserved timeout and image content-type validation.
- Added allowed-host, customer-CDN, Azure Blob, Akamai, and private-literal tests.

### Security response headers and image optimization

Changes in `next.config.js`:

- Added a page-level `Content-Security-Policy-Report-Only`.
- Restricted base URLs, object embedding, frame ancestors, and form actions.
- Declared current script, style, image, font, and connection sources for observation before enforcement.
- Added AVIF before WebP.
- Increased the image optimizer minimum cache TTL from 60 seconds to 24 hours.

The CSP remains report-only pending telemetry review.

### Route error recovery

The root application used a custom client class error boundary, which did not handle Server Component rendering failures and could replace all application chrome.

Changes:

- Added the Next.js `src/app/error.tsx` convention.
- Preserve the root layout and navigation on route failures.
- Log route-render failures.
- Provide a `reset()` retry action.
- Removed `src/components/ErrorBoundary.tsx` and its root-layout wrapper.

### Root metadata, robots, and sitemap

Changes:

- Corrected `metadataBase` to `https://www.mspulse360.app`.
- Added root Open Graph and Twitter metadata.
- Added `src/app/robots.ts`.
- Allow crawling of application pages and disallow `/api/`.
- Added the sitemap URL to robots output.
- Added `src/app/sitemap.ts` for primary portal routes.

### Per-item metadata and canonical URLs

Added `src/lib/detailMetadata.ts` for:

- Entity-decoded plain-text titles.
- Sanitized descriptions.
- A maximum description length of 160 characters.
- Canonical URLs.
- Article Open Graph metadata.
- Twitter summary metadata.
- `noindex, nofollow` for missing records.

Applied metadata to:

- `src/app/message/[id]/page.tsx`
- `src/app/m365-update/[id]/page.tsx`
- `src/app/m365-update/rss/[id]/page.tsx`

The RSS alias points to the primary Microsoft 365 detail canonical URL.

Azure, Release Plan, and Fabric details were deferred because their current pages do not all have safe single-item loaders and would otherwise duplicate expensive collection fetches.

### Product-filter accessibility and persistence

Changes in `src/components/ProductFilter.tsx`:

- Added `aria-selected` to listbox options.
- Made options keyboard-focusable.
- Added the service data key used by Enter selection.
- Preserved Arrow Up, Arrow Down, Enter, and Escape behavior.
- Added an explicit one-shot persisted-filter hydration guard.

The one-shot guard is required because a dependency-correct effect can rerun before the debounced local-storage removal completes. Without the guard, clearing the last filter could immediately restore the old saved selection.

### Image-modal accessibility and rendering

Changes in `src/components/ImageModal.tsx`:

- Replaced raw `<img>` with `next/image`.
- Added dialog and modal semantics.
- Added a descriptive accessible label.
- Move focus to the close control when opened.
- Restore previous focus when closed.
- Continue to close with Escape.
- Close only when selecting the backdrop, not when selecting content inside the dialog.

### Framework linting

ESLint 9 uses the flat configuration. The prior flat config omitted `eslint-config-next`, leaving installed Next.js performance and accessibility rules inactive.

Changes:

- Enabled `eslint-config-next/core-web-vitals`.
- Enabled `eslint-config-next/typescript`.
- Removed the duplicate legacy `.eslintrc.json`.
- Kept selected backlog rules as warnings to expose issues without turning unrelated cleanup into a blocker.
- Fixed a real conditional Hook call in `src/components/ProductNewsLayout.tsx`.
- Fixed only high-confidence accessibility/rendering warnings in the follow-up.

The focused follow-up reduced warnings from 164 to 157 with zero lint errors. It did not churn the entire warning backlog.

### Prettier tooling

`package.json` declared `pnpm format`, but Prettier was not installed.

Changes:

- Added Prettier `3.9.6` as a development dependency.
- Updated `pnpm-lock.yaml`.
- Verified changed files with `prettier --check`.

### Continuous integration

Added `.github/workflows/ci.yml` with:

- Pull request and `main` push triggers.
- Read-only repository permissions.
- Concurrency cancellation for superseded runs.
- Node.js `22.12.0`.
- pnpm setup and frozen lockfile installation.
- Prisma client generation.
- ESLint.
- TypeScript type checking.
- Deterministic Playwright tests.
- Production Next.js build.

### Repository cleanup

Removed:

- `.eslintrc.json`, superseded by the active flat config.
- `src/components/ErrorBoundary.tsx`, superseded by Next.js route error handling.
- `src/components/MessageCenterClient.tsx`, superseded by server loading.
- `src/components/SearchBar.tsx - Shortcut.lnk`, a tracked Windows shortcut.
- `tests-examples/demo-todo-app.spec.ts`, an unrelated Playwright scaffold.

## Tests added and retained

The deterministic suite now verifies:

- MSRC impact and severity extraction.
- Rejection of numeric CVSS values as severity labels.
- Lifecycle local-date parsing and retirement-day behavior.
- RSS GUID shape normalization.
- Invalid feed-date ordering.
- Feed entity decoding, including extended named entities.
- Message Center search fields.
- Image-proxy host boundaries and private literals.
- Fabric malformed JSON repair and partial-source resilience.
- Metadata sanitization, truncation, canonical URL fields, and missing-record indexing.

The existing sanitizer tests continue to cover:

- Script removal.
- Event-handler removal.
- `javascript:` and `data:` URL removal.
- Style removal.
- Iframe removal.
- Image proxy rewriting.
- External-link hardening.
- Structural HTML preservation.
- Plain-text extraction.

## Validation evidence

Final results:

| Validation                     | Result                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Prettier targeted check        | Passed with Prettier `3.9.6`.                                                 |
| ESLint                         | Exit code 0, 0 errors, 157 non-blocking warnings.                             |
| TypeScript                     | `tsc --noEmit` passed.                                                        |
| Playwright deterministic suite | 27 tests passed.                                                              |
| Production build               | Passed on Next.js `16.2.10`; TypeScript passed; 57/57 static pages generated. |
| Runtime smoke                  | `/home`, `/robots.txt`, and `/sitemap.xml` returned 200.                      |
| Proxy smoke                    | A customer AzureEdge image URL returned 400.                                  |
| Header smoke                   | Report-only CSP header was present.                                           |
| Diff integrity                 | `git diff --check` passed before each commit.                                 |

Prisma migrations were correctly skipped because `DATABASE_URL` was not configured.

## Review corrections completed before acceptance

Independent reviews identified and prompted fixes for:

1. A single failed Fabric product source rejecting the entire fan-out.
2. Persisted filters being reapplied after "Clear all."
3. Extended named entities rendering literally after the first pure-decoder refactor.

All review findings were corrected and covered before the implementation commits were accepted.

## Security and privacy results

No high- or medium-severity exploitable vulnerability was found in the audited scope.

The audit confirmed and retained:

- Production cron synchronization fails closed without `CRON_SECRET`.
- The RSS proxy is HTTPS-only, exact-host allowlisted, and does not follow unchecked redirects.
- Author slugs are constrained before use in fixed Microsoft URLs.
- MSRC month IDs are strictly validated.
- Graph credentials and tokens remain server-only.
- Message IDs are validated before OData interpolation.
- Graph pagination remains bounded.
- Prisma operations remain parameterized.
- Feed HTML remains sanitized before rendering.

## Urgent product decision: anonymous tenant Message Center

`/api/messages` intentionally serves the configured tenant's Message Center data to anonymous visitors.

This audit did not change that policy.

The presence of NextAuth does not imply the route is protected; no route-level authorization gate is currently enforced.

Required product decision:

- If the tenant data is intended for public publication, retain and clearly document the policy.
- If it may contain tenant-sensitive operational details, require authenticated and authorized access before production use.

## Deferred work

1. Resolve the anonymous Message Center product decision.
2. Convert remaining client-fetched Product News categories to Server Components.
3. Distinguish feed failures and stale fallback data from legitimate empty feeds.
4. Add metadata to remaining detail routes after safe single-item loaders exist.
5. Add a platform-approved distributed rate limiter to public proxies.
6. Configure Playwright `webServer` and mocked browser data so browser E2E tests cannot self-skip.
7. Resolve the remaining 157 lint warnings in focused changes.
8. Review CSP report-only telemetry before enforcing the policy.

## Constraints and tool notes

There was no repository, checkout, access, or content-exclusion blocker.

Tooling issues resolved during the audit:

- Bundled Corepack had an outdated signing-key set.
- The installed pinned pnpm `10.34.5` shim was used.
- The declared-but-missing Prettier dependency was added.

Live Graph, APIM, tenant database synchronization, and Prisma migrations were not tested because credentials and `DATABASE_URL` were intentionally unavailable. No credentials were requested or used.
