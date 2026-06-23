# Feed Consolidation Backlog
**Author:** Miller (Lead)  
**Date:** 2026-06-20  
**Source plan:** `.squad/agents/alex/feed-consolidation-plan.md`  
**Russ's 3 canonical decisions incorporated:**
1. `style` MUST be in `FORBID_ATTR` only — never in `ALLOWED_ATTR`. MS callout color loss accepted.
2. `<img>` stays in `ALLOWED_TAGS` but external `src` must be rewritten through `/api/image-proxy` (https-only). This is its own WI; sanitization rollout depends on it.
3. Implicit trust in official Microsoft endpoints is acceptable — **no endpoint-verification WIs**.

---

## Milestone Overview

| Milestone | Name | WIs | Ships When | Unlocks |
|---|---|---|---|---|
| **M0** | Security Hotfix — XSS Sanitization | WI-01 – WI-05 | First, independently | All remaining milestones |
| **M1** | Feed Foundation — Types, Config, Parsers | WI-06 – WI-09 | After M0 ships | M2, M3, M4 |
| **M2** | Route Migration — Server-Side Parsing | WI-10 – WI-13 | After M1 | M3, M4 |
| **M3** | Error & Cache Centralization | WI-14 – WI-16 | After M2 | M4 |
| **M4** | Cleanup & Dedup | WI-17 – WI-20 | After M3 | Done |

**Critical path:** WI-01 → WI-03 → WI-04 → WI-05 (milestone gate) → WI-06 → WI-07/08/09 → WI-10 → WI-11/12/13 → WI-14 → WI-15/16 → WI-17/18/19 → WI-20  
**Parallel paths in M0:** WI-01 ∥ WI-02 (both have no deps; WI-04 waits for both)

---

## Milestone 0 — Security Hotfix: XSS Sanitization
> Ships independently. Closes the 🔴 Critical XSS surface before any feed-migration work proceeds.

---

### WI-01 — Implement `sanitizeFeedHtml()` in `src/lib/feed/sanitize.ts`
**Owner:** Alex  
**Files:** `src/lib/feed/sanitize.ts` (new), `package.json` (add `isomorphic-dompurify` if not present)  
**Deps:** _none_

**Acceptance Criteria:**
- [ ] `sanitizeFeedHtml(html: string): string` exported from `src/lib/feed/sanitize.ts`
- [ ] `stripHtml(html: string): string` also exported (strips all tags; for plain-text summaries/excerpts)
- [ ] `SANITIZE_CONFIG` exported (used by both server helper and `SafeHtml` component)
- [ ] `isomorphic-dompurify` added to dependencies
- [ ] **`style` is NOT in `ALLOWED_ATTR`**; `style` IS in `FORBID_ATTR` — Russ decision #1 locked
- [ ] `ALLOWED_URI_REGEXP` restricts all URI attrs (`href`, `src`) to `https?:` only — blocks `javascript:`, `data:`, `vbscript:`, `blob:`
- [ ] Link hardening: `ADD_ATTR: ['target']`; a DOMPurify `AFTER_SANITIZE_ATTRS` hook sets `rel="noopener noreferrer"` and `target="_blank"` on every `<a>` element
- [ ] `<img>` remains in `ALLOWED_TAGS`; a DOMPurify `BEFORE_SANITIZE_ATTRS` hook rewrites every `img[src]` to `/api/image-proxy?url=<encodeURIComponent(src)>` — Russ decision #2 wired here
- [ ] `FORBID_TAGS`: `script`, `style`, `iframe`, `object`, `embed`, `form`, `input`, `textarea`
- [ ] `FORBID_ATTR`: `onerror`, `onload`, `onclick`, `onmouseover`, `style`, `formaction`
- [ ] `ALLOW_DATA_ATTR: false`
- [ ] Unit tests pass for: `<script>` injection, `javascript:` href, `data:` URI, `style` attr, `onerror` attr, img src proxy rewrite, `<a>` link rel/target hardening, `<iframe>` removal, known MS feed HTML preserves expected structure tags

---

### WI-02 — Internal image-proxy route `/api/image-proxy`
**Owner:** Amos  
**Files:** `src/app/api/image-proxy/route.ts` (new)  
**Deps:** _none_ (runs parallel with WI-01)

**Acceptance Criteria:**
- [ ] `GET /api/image-proxy?url=<encoded>` route handler exists
- [ ] Rejects any `url` that does not start with `https://` → `400 Bad Request` with JSON error
- [ ] Rejects missing/empty `url` → `400 Bad Request`
- [ ] Rejects `url` resolving to loopback, link-local, or RFC-1918 private IP ranges (SSRF protection) → `400`
- [ ] Fetches upstream image and pipes response body to client
- [ ] Forwards `Content-Type` from upstream response
- [ ] Sets `Cache-Control: public, max-age=86400, s-maxage=86400`
- [ ] Upstream fetch failure → `502` with `{ ok: false, error: { code: 'UPSTREAM_UNAVAILABLE', message: '...', source: 'image-proxy' } }`
- [ ] Does not expose upstream error details in response body
- [ ] TypeScript strict; no `any`

---

### WI-03 — `<SafeHtml>` client component
**Owner:** Naomi  
**Files:** `src/components/SafeHtml.tsx` (new)  
**Deps:** WI-01

**Acceptance Criteria:**
- [ ] File has `'use client'` directive
- [ ] Named export `SafeHtml`
- [ ] Props: `{ html: string; className?: string }`
- [ ] Re-sanitizes via `DOMPurify.sanitize(html, SANITIZE_CONFIG)` (imports `SANITIZE_CONFIG` from `@/lib/feed/sanitize`) before setting `dangerouslySetInnerHTML` — provides client-side defense-in-depth
- [ ] Renders `<div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />`
- [ ] No raw `dangerouslySetInnerHTML` inside the component without the sanitize call
- [ ] TypeScript build passes

---

### WI-04 — Apply `sanitizeFeedHtml()` + `<SafeHtml>` to all 8 unsanitized sites
**Owner:** Naomi  
**Files:**
- `src/components/AzureUpdateCard.tsx` (line 59 — `update.description`)
- `src/components/M365UpdateCard.tsx` (line 146 — `update.content`)
- `src/components/ReleasePlanCard.tsx` (line 159 — `plan.businessValue`)
- `src/components/ReleasePlanDetail.tsx` (lines 200, 206 — `plan.businessValue`, `plan.content`)
- `src/components/MessageDetail.tsx` (line 190 — `processedContent`)
- `src/app/azure-update/[id]/page.tsx` (line 133 — `update.description`)
- `src/app/m365-update/[id]/page.tsx` (line 143 — `update.content`)
- `src/app/m365-update/rss/[id]/page.tsx` (line 58 — `update.content`)

**Deps:** WI-01, WI-02, WI-03

**Acceptance Criteria:**
- [ ] Every `dangerouslySetInnerHTML` at each of the 8 listed sites is replaced by `<SafeHtml html={...} />` (client components) or by pre-sanitizing with `sanitizeFeedHtml()` server-side before passing to `dangerouslySetInnerHTML` (server components)
- [ ] **`MessageDetail.tsx`**: `sanitizeFeedHtml()` is called on the **output of the existing regex transform** (`processedContent`), not on raw `Message.content` — the regex runs first, sanitizer runs second
- [ ] No `style` attribute present in any rendered HTML in these pages (verify via DevTools)
- [ ] External images render via `/api/image-proxy` (verify in Network tab: img requests go to `/api/image-proxy?url=...`)
- [ ] All `<a>` links in feed HTML have `rel="noopener noreferrer"` and `target="_blank"` (verify via DevTools)
- [ ] `MessageCard.tsx` (already sanitized) is not modified — do not regress its existing DOMPurify usage
- [ ] `npm run type-check` passes; `npm run lint` passes

---

### WI-05 — XSS regression tests + visual-fidelity check
**Owner:** Bobbie  
**Files:** `tests/sanitize.spec.ts` (new unit), `tests/feed-pages.spec.ts` (new E2E)  
**Deps:** WI-04

**Acceptance Criteria:**
- [ ] Unit tests for `sanitizeFeedHtml()`: each of the following payloads produces output with the attack vector removed:
  - `<script>alert(1)</script>` → no `<script>` in output
  - `<img onerror="alert(1)" src="x">` → no `onerror` attr
  - `<a href="javascript:alert(1)">click</a>` → `href` removed or rewritten
  - `<a href="data:text/html,<script>alert(1)</script>">x</a>` → `href` blocked
  - `<p style="color:red;background:url(x)">text</p>` → `style` attr absent
  - `<iframe src="https://evil.com"></iframe>` → `<iframe>` stripped
  - `<img src="https://external.com/img.png">` → `src` rewritten to `/api/image-proxy?url=...`
  - `<a href="https://learn.microsoft.com">link</a>` → output contains `rel="noopener noreferrer"` and `target="_blank"`
- [ ] E2E: Visit Azure Update detail page — page renders, no console errors, no script execution
- [ ] E2E: Visit M365 Update detail page — page renders, no console errors
- [ ] E2E: Visit Release Plan detail page — page renders, no console errors
- [ ] E2E: Visit Message detail page — page renders, regex-transformed content visible, no console errors
- [ ] E2E: All four pages show content (not blank — visual fidelity preserved)
- [ ] `npx playwright test tests/feed-pages.spec.ts` passes in chromium

---

## Milestone 1 — Feed Foundation: Types, Config, Envelope, Parsers
> Starts after M0 ships. Creates the `src/lib/feed/` module that all route migrations depend on.

---

### WI-06 — Scaffold `src/lib/feed/` module skeleton
**Owner:** Alex  
**Files:** `src/lib/feed/types.ts`, `src/lib/feed/config.ts`, `src/lib/feed/envelope.ts`, `src/lib/feed/index.ts` (all new)  
**Deps:** WI-05 _(milestone gate — M0 must ship before M1 begins)_

**Acceptance Criteria:**
- [ ] `NormalizedUpdate` interface exported from `types.ts` with all fields: `id`, `source`, `title`, `summary`, `contentHtml`, `publishedAt`, `updatedAt`, `url`, `author`, `products`, `tags`, `status?`, `meta?`
- [ ] `FeedSource` union type exported from `types.ts` covering all 20 sources per Alex's plan
- [ ] `CACHE_TTL: Record<FeedSource, { list: number; detail: number }>` exported from `config.ts` with values per Alex's plan (including M365/Fabric light-cache values with comment noting intent)
- [ ] `fetchOptions(source: FeedSource, view?: 'list' | 'detail'): { next: { revalidate: number } }` exported from `config.ts`
- [ ] `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>` exported from `envelope.ts` with `fetchedAt`, `source`, `error.code`, `error.message` fields per Alex's plan
- [ ] `src/lib/feed/index.ts` re-exports all public symbols
- [ ] `npm run type-check` passes; no circular deps

---

### WI-07 — Implement `parsers/rss.ts` — single RSS parser
**Owner:** Alex  
**Files:** `src/lib/feed/parsers/rss.ts` (new)  
**Deps:** WI-06

**Acceptance Criteria:**
- [ ] `parseRssFeed(xml: string, source: FeedSource): NormalizedUpdate[]` exported
- [ ] Uses `fast-xml-parser` exclusively — no `xml2js`, `rss-parser`, or browser `DOMParser`
- [ ] Handles RSS 2.0 (`<rss>/<channel>/<item>`) and Atom (`<feed>/<entry>`) formats
- [ ] Maps: `title`, `link`/`id`, `pubDate`/`published`/`updated`, `description`/`content`/`summary`, `author`/`dc:creator`, `category` → `NormalizedUpdate` fields
- [ ] `contentHtml` passes through `sanitizeFeedHtml()` from `@/lib/feed/sanitize`
- [ ] Returns `[]` on empty feed; throws typed `Error` with `code: 'PARSE_ERROR'` on malformed XML
- [ ] Unit tests: RSS 2.0 fixture, Atom fixture, empty feed, malformed XML

---

### WI-08 — Implement `parsers/json-api.ts`
**Owner:** Alex  
**Files:** `src/lib/feed/parsers/json-api.ts` (new)  
**Deps:** WI-06

**Acceptance Criteria:**
- [ ] `parseJsonApi(data: unknown, source: FeedSource): NormalizedUpdate[]` exported
- [ ] Handles all 6 JSON sources: `message-center` (Graph), `azure-updates` (Release Comms), `m365-updates` (Release Comms), `release-plans` (releaseplans.microsoft.com), `msrc` (CVRF), `fabric-roadmap` (releaseplanner.azure-api.net)
- [ ] `contentHtml` sanitized via `sanitizeFeedHtml()` for each source
- [ ] Throws `Error` with `code: 'PARSE_ERROR'` on unrecognized source or schema mismatch
- [ ] Unit tests with fixture data for each of the 6 source shapes

---

### WI-09 — Implement `parsers/html-table.ts`
**Owner:** Alex  
**Files:** `src/lib/feed/parsers/html-table.ts` (new)  
**Deps:** WI-06

**Acceptance Criteria:**
- [ ] `parseHtmlTable(html: string): NormalizedUpdate[]` exported
- [ ] Logic extracted from existing `getCopilotStudioNews` regex in `src/lib/api.client.ts` — identical output, no behavior change
- [ ] Returns `[]` on empty/unparseable input (no throw)
- [ ] Unit test with real Copilot Studio HTML fixture producing the same items as the current code

---

## Milestone 2 — Route Migration: Server-Side Parsing
> Migrates 12 RSS proxy routes and existing server/page fetchers onto the centralized module.

---

### WI-10 — Migrate 12 RSS proxy routes to server-side parsing + JSON response
**Owner:** Alex (parser integration); Amos reviews route plumbing  
**Files:** All 12 RSS proxy route handlers under `src/app/api/` (power-apps, power-platform, power-automate, power-bi, copilot, copilot-studio, learn-blog, microsoft-news, tech-community, fabric-blog, semantic-kernel, azure-ai-foundry, azure-ai-ml)  
**Deps:** WI-07, WI-09

**Acceptance Criteria:**
- [ ] All 13 listed routes parse upstream XML/HTML server-side (using `parseRssFeed` or `parseHtmlTable`) and return `ApiSuccess<NormalizedUpdate[]>` JSON
- [ ] Routes no longer return raw XML; `Content-Type: application/json`
- [ ] Each route uses `fetchOptions(source, 'list')` for its fetch cache
- [ ] On upstream failure: `502` + `ApiError` with `code: 'UPSTREAM_UNAVAILABLE'`
- [ ] On parse failure: `502` + `ApiError` with `code: 'PARSE_ERROR'`
- [ ] `azure-ai-ml-news` route: migrated from `rss-parser` to `parseRssFeed`
- [ ] `fabric-blog-news` route: migrated from `xml2js` to `parseRssFeed`
- [ ] `npm run type-check` passes; `npm run lint` passes

---

### WI-11 — Update `api.client.ts` — replace per-source parsers with unified consumer
**Owner:** Alex  
**Files:** `src/lib/api.client.ts`  
**Deps:** WI-10

**Acceptance Criteria:**
- [ ] All 12 individual `get*News()` client functions updated to consume `NormalizedUpdate[]` JSON (no longer parse XML/HTML client-side)
- [ ] No `DOMParser`, `fast-xml-parser`, or `xml2js` imports in `api.client.ts`
- [ ] Existing callers (product-news pages) continue to receive data without API shape changes (backward-compat shims if needed)
- [ ] `npm run type-check` passes

---

### WI-12 — Migrate server-side fetchers in `api.server.ts`
**Owner:** Alex  
**Files:** `src/lib/api.server.ts`  
**Deps:** WI-07, WI-08

**Acceptance Criteria:**
- [ ] `getAzureUpdates`, `getM365Updates`, `getM365Update`, `getReleasePlans`, `getMessages`, `getMessage` use centralized parsers (`parseJsonApi`, `parseRssFeed`) where applicable
- [ ] Direct `fast-xml-parser` instantiation in `api.server.ts` removed; goes through `parseRssFeed`
- [ ] Cache uses `fetchOptions` from `config.ts`; no hardcoded `revalidate` values remain
- [ ] `npm run type-check` passes

---

### WI-13 — Migrate page-level fetchers
**Owner:** Alex  
**Files:** `src/app/product-news/all-things-azure/page.tsx`, `src/app/release-plans/fabric/page.tsx`  
**Deps:** WI-07, WI-08

**Acceptance Criteria:**
- [ ] `all-things-azure/page.tsx`: `xml2js` import removed; uses `parseRssFeed` from `@/lib/feed/parsers/rss`
- [ ] `release-plans/fabric/page.tsx`: local `getFabricRoadmap` and local `FabricRoadmapItem` removed; imports from `src/lib/fabricApi.ts` (WI-17 consolidates that lib, but the page import is set up here)
- [ ] Page behavior unchanged; `npm run type-check` passes

---

## Milestone 3 — Error & Cache Centralization

---

### WI-14 — Apply unified error envelope to all `/api/*` routes
**Owner:** Amos  
**Files:** All route handlers under `src/app/api/` not already migrated in WI-10  
**Deps:** WI-10

**Acceptance Criteria:**
- [ ] Every route returns `ApiSuccess<T> | ApiError` — no route returns plain-text errors
- [ ] No route returns `200` with `{ items: [] }` or `200 []` when the upstream is actually down
- [ ] HTTP status codes per convention: `502` upstream failure, `400` bad param, `404` not found, `503` auth failure (Graph), `403` host not allowed (proxy-rss)
- [ ] `messages` route: Graph auth failure returns `503` + `code: 'AUTH_FAILURE'`
- [ ] `proxy-rss` route: host-not-allowed returns `403` + `code: 'HOST_NOT_ALLOWED'`
- [ ] `msrc` route: mirrors upstream status as before, but with `ApiError` JSON body
- [ ] `microsoft-news-authors` route: no longer silently returns `200 []` on error (returns `ApiError`)
- [ ] `npm run type-check` passes

---

### WI-15 — Apply centralized `CACHE_TTL` config to all fetch calls
**Owner:** Alex  
**Files:** All route handlers and fetcher libs  
**Deps:** WI-06, WI-12, WI-13

**Acceptance Criteria:**
- [ ] No hardcoded `next: { revalidate: N }` values anywhere in `src/`; all replaced by `fetchOptions(source, view)`
- [ ] `M365 Updates`: moved from `cache: 'no-store'` to `revalidate: 1800` — code comment states: _"intentional: was no-store (perf risk on serverless); set to 30m. Revert to 0 if real-time freshness required."_
- [ ] `Fabric Roadmap`: same treatment, `revalidate: 3600` with equivalent comment
- [ ] `npm run type-check` passes

---

### WI-16 — Update UI error handling — detect `ok: false`, show error states
**Owner:** Naomi  
**Files:** Product-news page components and feed-consuming client components  
**Deps:** WI-14

**Acceptance Criteria:**
- [ ] Client components that fetch from `/api/*` routes check `response.ok` and the `{ ok: false }` body field
- [ ] On `ok: false`: render a user-visible error state ("Unable to load updates — please try again later") instead of an empty list
- [ ] Empty list state remains for `ok: true, data: []` (genuine empty feed)
- [ ] Error state uses existing Shadcn UI error/alert primitive (not a new component)
- [ ] No `any` casts; `npm run type-check` passes; `npm run lint` passes

---

## Milestone 4 — Cleanup & Dedup

---

### WI-17 — Collapse Fabric duplication into `fabricApi.ts`
**Owner:** Alex  
**Files:** `src/lib/fabricApi.ts`, `src/app/release-plans/fabric/page.tsx`  
**Deps:** WI-13

**Acceptance Criteria:**
- [ ] `FABRIC_PRODUCT_IDS: Record<string, string>` map (all 11 product IDs) exported from `fabricApi.ts`
- [ ] `getAllFabricRoadmapItems(): Promise<ReleasePlan[]>` exported — fetches all product IDs in parallel via `Promise.all`
- [ ] `mapToReleasePlan(item: FabricRoadmapItem): ReleasePlan` exported
- [ ] Local `FabricRoadmapItem` interface, local `getFabricRoadmap`, and hardcoded product IDs removed from `release-plans/fabric/page.tsx`
- [ ] Page is a thin render shell: `const allPlans = await getAllFabricRoadmapItems(); return <FabricRoadmapContent allPlans={allPlans} />`
- [ ] No behavior change: Playwright test for Fabric Roadmap page passes

---

### WI-18 — Remove `xml2js` and `rss-parser` from `package.json`
**Owner:** Alex  
**Files:** `package.json`, lockfile  
**Deps:** WI-10, WI-13

**Acceptance Criteria:**
- [ ] `xml2js` absent from `dependencies` and `devDependencies`
- [ ] `rss-parser` absent from `dependencies` and `devDependencies`
- [ ] Zero `import ... from 'xml2js'` or `import ... from 'rss-parser'` in `src/` (grep confirms)
- [ ] `npm install` completes without errors
- [ ] `npm run build` passes

---

### WI-19 — Audit `microsoft-news-authors` route
**Owner:** Alex  
**Files:** `src/app/api/microsoft-news-authors/route.ts`  
**Deps:** WI-10

**Acceptance Criteria:**
- [ ] Route assessed: document in code comment whether it should be migrated to centralized module (if its HTML-scraping pattern is reusable) or remain bespoke (if it's a one-off)
- [ ] Regardless of outcome: route wrapped in `ApiResponse` envelope (already covered by WI-14, but verify this route specifically)
- [ ] If bespoke: add comment explaining the isolated HTML-scraping approach and why it can't use `parseHtmlTable`
- [ ] If migrated: follows `parseHtmlTable` or a new parser variant; `DOMParser` usage removed
- [ ] Assessment notes appended to `.squad/agents/alex/` notes or inline

---

### WI-20 — Integration smoke tests + full regression (M4 gate)
**Owner:** Bobbie  
**Files:** `tests/integration.spec.ts` (new or extended)  
**Deps:** WI-16, WI-17, WI-18

**Acceptance Criteria:**
- [ ] Smoke test: at least 6 major routes (`/api/azure-updates`, `/api/m365-updates`, `/api/messages`, `/api/msrc`, `/api/power-apps-news`, `/api/fabric-blog-news`) return `{ ok: true, data: [...] }` on happy path
- [ ] Regression: mock upstream returning `500` → route returns `{ ok: false }` with 502 (not `200 { items: [] }`)
- [ ] UI regression: mocked `ok: false` response on a product-news page renders error banner, not empty list
- [ ] Fabric Roadmap page loads without errors; shows items; no broken images
- [ ] No `xml2js` or `rss-parser` import anywhere in `src/` (static grep assertion in test)
- [ ] `npm run build` passes cleanly

---

## Dependency Order Summary

```
[No deps]       WI-01 (sanitize.ts)         WI-02 (image-proxy route)
                    │                               │
                    ├───────────────────────────────┤
                    ▼                               ▼
              WI-03 (SafeHtml)            ← both needed for →
                    │
                    ▼
              WI-04 (apply to 8 sites) ← also depends on WI-02
                    │
                    ▼
              WI-05 (XSS regression) ← M0 SHIPS ─────────────────────────────┐
                    │                                                           │
                    ▼                                                           │
              WI-06 (feed/ scaffold) [milestone gate on WI-05]                 │
                    │                                                           │
          ┌─────────┼─────────┐                                                │
          ▼         ▼         ▼                                                │
      WI-07       WI-08     WI-09                                             │
      (rss.ts)  (json-api)  (html-table)                                      │
          │         │                                                           │
          └────┬────┘                                                           │
               ▼                                                                │
          WI-10 (migrate 12 RSS routes)                                        │
               │                                                                │
          ┌────┴──────────────────┐                                             │
          ▼                       ▼                                             │
      WI-11 (api.client.ts)   WI-12 (api.server.ts) + WI-13 (page fetchers)   │
          │                       │                                             │
          └───────────────────────┤                                             │
                                  ▼                                             │
                           WI-14 (error envelope) ← M2 gate                    │
                                  │                                             │
                      ┌───────────┴───────────┐                                │
                      ▼                       ▼                                │
                  WI-15 (cache TTL)     WI-16 (UI error states)               │
                      │                       │                                │
                      └───────────┬───────────┘                                │
                                  ▼                                             │
                    WI-17 (Fabric dedup)  WI-18 (rm deps)  WI-19 (authors)    │
                                  │                                             │
                                  ▼                                             │
                            WI-20 (M4 regression) ← DONE ──────────────────────┘
```

---

## Work Item Quick-Reference Table

| ID | Title | Owner | Deps |
|---|---|---|---|
| WI-01 | Implement `sanitizeFeedHtml()` in `src/lib/feed/sanitize.ts` | Alex | — |
| WI-02 | Internal image-proxy route `/api/image-proxy` | Amos | — |
| WI-03 | `<SafeHtml>` client component | Naomi | WI-01 |
| WI-04 | Apply sanitization to 8 unsanitized `dangerouslySetInnerHTML` sites | Naomi | WI-01, WI-02, WI-03 |
| WI-05 | XSS regression tests + visual-fidelity check | Bobbie | WI-04 |
| WI-06 | Scaffold `src/lib/feed/` module (types, config, envelope) | Alex | WI-05 *(milestone gate)* |
| WI-07 | Implement `parsers/rss.ts` | Alex | WI-06 |
| WI-08 | Implement `parsers/json-api.ts` | Alex | WI-06 |
| WI-09 | Implement `parsers/html-table.ts` | Alex | WI-06 |
| WI-10 | Migrate 12 RSS proxy routes to server-side parsing + JSON | Alex (+Amos review) | WI-07, WI-09 |
| WI-11 | Update `api.client.ts` — unified `NormalizedUpdate` consumer | Alex | WI-10 |
| WI-12 | Migrate server-side fetchers in `api.server.ts` | Alex | WI-07, WI-08 |
| WI-13 | Migrate page-level fetchers (all-things-azure, fabric page) | Alex | WI-07, WI-08 |
| WI-14 | Apply unified error envelope to all `/api/*` routes | Amos | WI-10 |
| WI-15 | Apply centralized `CACHE_TTL` to all fetch calls | Alex | WI-06, WI-12, WI-13 |
| WI-16 | Update UI error handling — detect `ok: false`, show error states | Naomi | WI-14 |
| WI-17 | Collapse Fabric duplication into `fabricApi.ts` | Alex | WI-13 |
| WI-18 | Remove `xml2js` and `rss-parser` from `package.json` | Alex | WI-10, WI-13 |
| WI-19 | Audit/archive `microsoft-news-authors` route | Alex | WI-10 |
| WI-20 | Integration smoke tests + full M4 regression | Bobbie | WI-16, WI-17, WI-18 |
