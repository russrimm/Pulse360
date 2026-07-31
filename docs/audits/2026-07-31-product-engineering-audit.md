# Pulse 360 Product and Engineering Audit

**Audit date:** July 31, 2026  
**Repository:** `russrimm/Pulse360`  
**Branch:** `russrimm-pulse360-deep-audit`  
**Baseline:** `4d594a71ab58134f64c472cb995b3c8043187126`

## Executive summary

This audit covered product correctness, tenant-data exposure, feed and date normalization, MSRC/CVE accuracy, Graph authentication boundaries, SSRF protection, caching and resilience, Prisma persistence, search and filtering, accessibility, SEO, Server/Client boundaries, rendering and network performance, tests, CI, dependencies, and operational documentation.

The work was delivered in two reviewed commits:

| Commit                                     | Description                                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `7875b0d4da6fd3d4c40e2c0733cdd22849d98c33` | Corrected data accuracy, restored core workflows, hardened proxy boundaries, improved resilience and caching, added SEO/error handling, and established CI gates. |
| `6f09b6e22ed6d74afdb9ed6f4a471116f0c3acff` | Added formatter tooling, request-deduplicated per-item metadata, and focused accessibility/rendering fixes.                                                       |

No credentials were used, no deployment was performed, and no cloud resources or settings were changed.

## Implemented changes

### 1. MSRC and CVE accuracy

The MSRC CVRF schema was being interpreted incorrectly:

- Impact was searched by a string threat type, but CVRF supplies numeric threat type `0`.
- Severity was read from a nonexistent `Severity` property and could fall back to a numeric CVSS base score, causing a number such as `4.3` to be labeled as "Max Severity."
- CVRF severity is actually threat type `3`, with the rating in `Description.Value`.

Changes:

- Added typed MSRC normalization helpers in `src/lib/msrc.ts`.
- Mapped threat type `0` to impact and threat type `3` to the MSRC severity label.
- Removed the invalid CVSS-number-as-severity fallback.
- Simplified `src/components/CVECard.tsx` and removed unused/dead detail-formatting code.
- Replaced the remaining raw Microsoft Graph product icon with `next/image`.

Result: the MSRC table now reports the source-provided impact and severity labels rather than misleading values.

### 2. Lifecycle date correctness

Date-only lifecycle values such as `2026-07-31` were parsed as UTC in one code path and compared with local midnight. In negative UTC offsets, this could mark a product expired one calendar day early.

Changes:

- Added local-calendar date parsing and status derivation in `src/lib/lifecycle.ts`.
- Reused the normalized parser in `src/components/MsLifecycleClient.tsx`.
- Added a regression test proving a product is not expired on its retirement date.

### 3. Feed identity, date, and text normalization

RSS GUID handling assumed all GUIDs were parsed as objects with a `#text` property. `fast-xml-parser` returns an unattributed GUID as a plain string, so stable source IDs could be discarded in favor of mutable links.

Changes:

- Added feed helpers in `src/lib/feed/normalize.ts`.
- Preserved both plain-string and attributed RSS GUIDs.
- Converted malformed feed dates to timestamp `0` for deterministic oldest-first placement instead of `NaN` sort behavior.
- Stopped malformed or missing dates from being displayed as the current date.
- Added pure entity decoding for numeric/basic entities.
- Added `src/lib/feed/text.ts` to normalize feed text through the existing sanitizer, preserving the full named-entity set without client-side DOM effects.
- Updated `src/lib/api.client.ts` and `src/components/ProductNewsCard.tsx` to use the shared helpers.

Result: feed identity is stable, malformed dates are not misleading, extended entities render correctly, and news cards no longer perform state-setting entity-decoding effects after hydration.

### 4. Message Center workflow, freshness, and source attribution

`MessageList` already contained search-filter logic, but no search input was rendered, leaving the flagship Message Center workflow inaccessible.

Changes:

- Rendered the shared search control in `src/components/MessageList.tsx`.
- Added `src/lib/messageSearch.ts`.
- Search now covers message ID, title, content, summary, services, and tags, case-insensitively.
- Added an accessible search label.
- Converted `src/app/message-center/page.tsx` to server-side data loading.
- Removed the client-side `MessageCenterClient` fetch waterfall.
- Displayed the source as Microsoft Graph Message Center for the configured tenant.
- Displayed the last successful sync time and a stale-data warning when the sync is missing or more than two hours old.
- Added a public shared-cache policy of `s-maxage=60, stale-while-revalidate=300` to `/api/messages`.
- Kept the intentionally anonymous/public route behavior unchanged.

Result: Message Center search is usable, initial content is server-rendered, repeat anonymous requests can use shared caching, and users can see when and where the tenant data was sourced.

### 5. Microsoft 365 detail performance

`src/app/m365-update/[id]/page.tsx` downloaded the entire Microsoft 365 update feed and searched it for one item even though `getM365Update(id)` already provided a single-item loader.

Changes:

- Switched the detail route to `getM365Update(id)`.
- Reused the same loader in the RSS detail alias.
- Added request-level React cache wrappers in both routes so `generateMetadata` and page rendering share the same result.

### 6. Fabric roadmap caching and resilience

Fabric detail pages fan out across multiple product IDs. Those upstream calls were uncached, and the Microsoft Fabric endpoint was verified to emit malformed JSON in at least two forms:

- Raw control characters inside JSON strings.
- Invalid markdown-style escapes such as `\_`.

Changes:

- Centralized Fabric fetching and response validation in `src/lib/fabricApi.ts`.
- Added one-hour Next.js fetch revalidation.
- Added a bounded repair pass that only runs after normal `JSON.parse` fails.
- Escaped raw control characters and removed invalid string escape prefixes while preserving valid JSON escapes.
- Rejected responses that still were not valid roadmap payloads.
- Added `Promise.allSettled` batch loading.
- Kept successful product areas when one upstream product fails.
- Logged failed product IDs and displayed a visible partial-data warning.
- Avoided returning a false 404 for a detail item when one or more product sources failed; incomplete lookups now surface as temporary upstream failures.
- Continued to fail explicitly if every Fabric product source fails.
- Removed duplicate Fabric fetching logic from `src/app/release-plans/fabric/page.tsx`.

Result: repeated page loads are cached, known malformed upstream responses are recoverable, and one failed product source no longer blanks the whole Fabric roadmap.

### 7. Image-proxy and response hardening

The image proxy accepted broad suffixes such as `azureedge.net`, `windows.net`, and Akamai domains. Those namespaces include customer-provisionable hosts and allowed the site to proxy attacker-controlled images through the Pulse 360 origin.

Changes:

- Moved validation into `src/lib/imageProxySecurity.ts`.
- Removed customer-provisionable Azure Storage/CDN and broad Akamai suffixes.
- Retained Microsoft-controlled host families required by the portal.
- Preserved HTTPS-only URLs, private/loopback/link-local literal rejection, manual redirect handling, upstream content-type validation, and request timeouts.
- Added regression tests for allowed Microsoft hosts, blocked AzureEdge/Blob/Akamai hosts, and private literals.
- Added a page-level `Content-Security-Policy-Report-Only` header in `next.config.js`.
- Added AVIF image output and increased the image optimizer minimum cache TTL to 24 hours.

The CSP is intentionally report-only so violations can be observed before enforcement.

### 8. Error handling and route resilience

The entire application was wrapped in a custom client class boundary. It could remove the full application chrome and did not catch Server Component failures during rendering.

Changes:

- Added `src/app/error.tsx` using the Next.js route error convention.
- Preserved navigation and layout when a route fails.
- Added a retry action using the provided `reset()` callback.
- Removed `src/components/ErrorBoundary.tsx` and its root-layout wrapper.

### 9. SEO, canonical URLs, and shareability

Changes:

- Corrected `metadataBase` from `https://www.russrimmerman.com` to the live site, `https://www.mspulse360.app`.
- Added root Open Graph and Twitter metadata.
- Added `src/app/robots.ts`; API routes are disallowed from crawling and the sitemap is declared.
- Added `src/app/sitemap.ts` for the portal's primary static routes.
- Added `src/lib/detailMetadata.ts`.
- Added per-item metadata for:
  - `src/app/message/[id]/page.tsx`
  - `src/app/m365-update/[id]/page.tsx`
  - `src/app/m365-update/rss/[id]/page.tsx`
- Metadata includes a canonical URL, article Open Graph fields, Twitter summary fields, entity-decoded plain-text titles, and descriptions capped at 160 characters.
- The RSS alias canonicalizes to the primary `/m365-update/[id]` route.
- Missing detail records are marked `noindex, nofollow`.
- Existing single-item loaders are wrapped with React `cache()` so metadata and page rendering do not duplicate work within a request.

### 10. Accessibility and interaction fixes

Changes:

- Product-filter listbox options now expose `aria-selected`.
- Options are keyboard-focusable and include the service key used by Enter-key selection.
- Persisted product filters are hydrated only once. This prevents a stale local-storage value from immediately undoing "Clear all" before the debounced removal completes.
- The image modal now:
  - Uses `next/image`.
  - Exposes dialog and modal semantics.
  - Moves focus to the close button.
  - Restores prior focus on close.
  - Supports Escape.
  - Closes only when the backdrop itself is selected, not for clicks inside the image container.

### 11. Linting, formatting, CI, and repository hygiene

The ESLint 9 flat configuration did not include `eslint-config-next`, so Next.js performance, accessibility, and framework rules were not active even though the package was installed.

Changes:

- Replaced the duplicate legacy `.eslintrc.json` path with the flat:
  - `eslint-config-next/core-web-vitals`
  - `eslint-config-next/typescript`
- Preserved selected legacy rules as warnings to expose the backlog without making unrelated cleanup a release blocker.
- Fixed a real conditional Hook call in `src/components/ProductNewsLayout.tsx`.
- Added `.github/workflows/ci.yml` for:
  - Frozen pnpm installation.
  - Prisma client generation.
  - Lint.
  - Type-check.
  - Deterministic Playwright tests.
  - Production build.
- Added Prettier `3.9.6` as a development dependency so the existing `pnpm format` script is valid.
- Added formatter verification for the changed files.
- Removed:
  - The unused client Message Center wrapper.
  - The obsolete custom root error boundary.
  - A tracked Windows shortcut named `SearchBar.tsx - Shortcut.lnk`.
  - The unrelated Playwright scaffold test in `tests-examples/demo-todo-app.spec.ts`.

The targeted follow-up reduced the warning count from 164 to 157 without attempting a broad warning-only refactor.

## Test coverage added

`tests/data-integrity.spec.ts` covers:

- MSRC impact and severity mapping.
- Rejection of numeric CVSS scores as severity labels.
- Local-calendar lifecycle parsing.
- Retirement-date boundary behavior.
- Plain and attributed RSS GUID normalization.
- Malformed feed date sorting.
- Basic, numeric, hexadecimal, and extended named-entity normalization.
- Message Center search fields and case handling.
- Allowed and blocked image-proxy hosts.
- Private literal SSRF rejection.
- Fabric malformed JSON repair.
- Fabric invalid response rejection.
- Partial Fabric source failure behavior.
- Metadata sanitization, canonical fields, length bounds, and missing-record indexing behavior.

The existing sanitizer regression suite remained green and continued to cover scripts, event handlers, dangerous URL schemes, iframes, proxied images, hardened links, structural HTML, and plain-text extraction.

## Validation evidence

Final validation after both commits:

| Check                            | Result                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec prettier --check ...` | Passed; all targeted files use Prettier formatting.                                                                                                    |
| `pnpm lint`                      | Passed with exit code 0, 0 errors, and 157 non-blocking warnings.                                                                                      |
| `pnpm type-check`                | Passed.                                                                                                                                                |
| Deterministic Playwright suite   | 27 tests passed.                                                                                                                                       |
| `pnpm build`                     | Passed with Next.js 16.2.10; TypeScript passed and 57/57 static pages generated.                                                                       |
| Production smoke test            | `/home`, `/robots.txt`, and `/sitemap.xml` returned 200; a customer AzureEdge image URL was rejected with 400; the report-only CSP header was present. |
| `git diff --check`               | Passed before each commit.                                                                                                                             |

The build correctly skipped Prisma migrations because `DATABASE_URL` was not set.

## Review findings resolved before commit

Independent final diff reviews caught and prompted fixes for:

1. A Fabric fan-out regression where one failed product source could reject the full `Promise.all` and blank the roadmap.
2. Persisted filters being reapplied immediately after a user selected "Clear all."
3. A narrowed entity decoder that would have rendered extended named entities such as `&mdash;` literally.

All three issues were corrected and regression-tested before the final commits were accepted.

## Security and privacy assessment

No high- or medium-severity exploitable vulnerability was identified in the reviewed scope.

Reviewed controls that were retained:

- Cron sync fails closed in production when `CRON_SECRET` is missing.
- RSS proxy targets are HTTPS-only, exact-host allowlisted, and do not follow unchecked redirects.
- Author feed slugs are constrained before being used in fixed Microsoft URLs.
- MSRC month IDs are strictly validated.
- Graph credentials and access tokens remain server-only.
- Message IDs are validated before being interpolated into OData filters.
- Graph pagination remains bounded.
- Prisma access uses parameterized client operations rather than raw SQL.
- Feed HTML remains sanitized before rendering.

## Explicit product decision: anonymous tenant Message Center data

`/api/messages` intentionally serves the configured tenant's Message Center data to anonymous visitors. This audit did **not** change that policy.

The route documentation currently describes the behavior as intentional, while the installed NextAuth scaffolding does not enforce a session gate on the route. This must remain an urgent, explicit product-owner decision:

- If the configured tenant's Message Center data is intended for public publication, retain and document the anonymous policy.
- If it may include tenant-sensitive operational information, require authenticated and authorized access before production use.

This decision should not be inferred from the presence of NextAuth; route-level authorization is not currently enforced.

## Deferred recommendations

The following items were intentionally not included because they require broader product, architectural, or infrastructure decisions:

1. **Message Center authorization:** Resolve the anonymous tenant-data decision described above.
2. **Product News Server Components:** Convert the remaining client-fetched category pages to Server Components to remove first-render waterfalls, browser XML parsing, and ineffective browser-side `next.revalidate` options.
3. **Feed error and stale states:** Standardize feed loaders so an upstream failure is distinguishable from a legitimate empty feed.
4. **Remaining detail metadata:** Add per-item metadata to Azure Update, Release Plan, and Fabric detail routes after introducing safe request-deduplicated single-item loaders. The current Azure and release-plan pages fetch full collections.
5. **Rate limiting:** Add a platform-approved distributed limiter to public proxy routes. No speculative external service was selected during this audit.
6. **Browser E2E automation:** Configure Playwright `webServer` and mocked data so feed-page browser tests run rather than self-skip when no server is available.
7. **Lint backlog:** Address the remaining 157 warnings in focused changes rather than a broad churn-only cleanup.
8. **CSP enforcement:** Review report-only CSP telemetry and move to an enforced policy after required sources and nonces are confirmed.

## Constraints and blockers

There was no repository, checkout, access, or content-exclusion blocker.

Environment limitations encountered and resolved:

- The bundled Corepack had an outdated signing-key set. The already-installed pinned pnpm `10.34.5` shim was used instead.
- Prettier was referenced by a package script but absent from dependencies; it was added in the follow-up commit.

Live Graph, APIM, tenant database synchronization, and Prisma migrations were not exercised because credentials and `DATABASE_URL` were intentionally unavailable. No attempt was made to obtain or use credentials.
