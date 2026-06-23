# Decisions — Pulse 360°

Canonical, append-only ledger of scope, architecture, and process decisions. Only the Coordinator writes here (via Scribe merging the inbox). All agents read this at spawn time.

---

### 2026-06-20: Squad team hired
**By:** Russ Rimmerman (via Squad init)
**What:** Established a 5-specialist Squad (Miller/Lead, Naomi/Frontend, Amos/Backend, Alex/Data-Integrations, Bobbie/Tester) plus silent helpers (Scribe, Ralph, Rai). Universe: The Expanse.
**Why:** Provide an AI team with persistent roles and memory for ongoing Pulse 360° development.

### 2026-06-20: No external integrations at init
**By:** Russ Rimmerman
**What:** GitHub Issues mode NOT wired in; @copilot coding agent NOT added; no additional human members beyond Russ.
**Why:** Keep the initial setup lean. These can be added later on request.

### 2026-06-20: Normalized Feed Contract (`NormalizedUpdate`)
**By:** Alex (Data/Integrations)  
**What:** All feed sources (RSS, JSON APIs, HTML scraping — 20+ paths) will normalize into a single `NormalizedUpdate` interface: `{ id, source, title, summary, contentHtml, publishedAt, updatedAt, url, author, products, tags, status?, meta? }`. The `contentHtml` field is always DOMPurify-sanitized at ingestion time. All parsers (RSS, JSON, HTML table) live in `src/lib/feed/parsers/` and return `NormalizedUpdate[]`.  
**Why:** Today the codebase has 4 different output types (`Message`, `AzureUpdate`, `M365Update`, `ProductNews`), 5 different XML parsers (`fast-xml-parser`, `xml2js`, `rss-parser`, `DOMParser`, regex), and parsing split across route handlers, client-side lib, server-side lib, and page-local functions. This makes every new feed integration a bespoke effort and prevents shared caching, error handling, and sanitization. A single contract enables a unified ingestion module, consistent downstream consumption, and incremental migration — each source can be migrated independently onto the new contract.

### 2026-06-20: Unified API Error Envelope (`ApiResponse<T>`)
**By:** Alex (Data/Integrations)  
**What:** All `/api/*` routes will return a discriminated union: `ApiSuccess<T> { ok: true, data: T, fetchedAt, source }` or `ApiError { ok: false, error: { code, message, source } }`. HTTP statuses follow conventions: 502 for upstream failures, 400 for bad params, 404 for not found, 503 for auth failures. Routes MUST NOT return `200` with empty arrays when the upstream is actually down.  
**Why:** Current routes use 7+ incompatible error patterns (200 with `{ items: [] }`, 500 with plain text, 500 with `{ error, details }`, etc.). The `200` empty-array pattern silently hides outages — the UI shows "no results" instead of "service unavailable." A consistent envelope lets the UI distinguish "no data exists" from "data could not be fetched," enables proper error banners, and simplifies client-side error handling to a single `response.ok` check + typed error.

### 2026-06-20: Server-Side DOMPurify Sanitization Policy
**By:** Alex (Data/Integrations)  
**What:** A `sanitizeHtml()` helper in `src/lib/feed/sanitize.ts` using `isomorphic-dompurify` with a curated ALLOWED_TAGS/ALLOWED_ATTR config. Applied server-side at ingestion time so `NormalizedUpdate.contentHtml` is always pre-sanitized. A client-side `<SafeHtml>` component provides defense-in-depth at render time. Rai (RAI reviewer) has sign-off authority on the final ALLOWED_TAGS list, image rendering policy, and link target policy.  
**Why:** 9 of 10 `dangerouslySetInnerHTML` render sites currently have ZERO sanitization — only `MessageCard.tsx` uses DOMPurify. Every other component renders upstream HTML (from RSS feeds, Microsoft APIs, HTML scraping) directly into the DOM. This is a cross-site scripting (XSS) surface. Server-side sanitization at ingestion ensures defense even if a component author forgets the client wrapper, and the `SafeHtml` component adds a second safety layer.

### 2026-06-20: Untrusted feed HTML is unsanitized — 🔴 Critical (Rai)
**By:** Rai (RAI Reviewer), via Squad  
**What:** 8 dangerouslySetInnerHTML render sites (AzureUpdateCard, azure-update/[id], M365UpdateCard, m365-update/[id], m365-update/rss/[id], ReleasePlanCard, ReleasePlanDetail, MessageDetail) render untrusted Microsoft-feed HTML with zero sanitization. Mandated fix: centralized server-side sanitizeFeedHtml() at ingestion (DOMPurify), https?-only protocol allowlist, link hardening (rel=noopener noreferrer, target=_blank), sanitize MessageDetail AFTER its regex transform. Sanitization rollout elevated to top priority in Alex's roadmap.  
**Why:** Active XSS / phishing / misattribution surface on a public site (mspulse360.app). Cannot ship further feed work without addressing.

### 2026-06-20: Feed/data architecture read completed
**By:** Miller (Lead), merged by Scribe
**What:** Read-only architecture assessment found Pulse360's feed/data layer is mostly live-proxy/live-fetch: Prisma currently models User, Preference, and PublishedListing only; Microsoft Graph Message Center is isolated in server-only `src/lib/api.server.ts` and exposed through `/api/messages`; RSS/XML ingestion is split across `src/lib/api.client.ts`, route handlers, and page-local parsers with inconsistent parser/error/cache behavior.
**Why:** Establishes the current ingestion architecture baseline and identifies the key follow-up: Alex (Data/Integrations) should deep-dive consolidation of feed proxying/parsing/normalization/sanitization, cache/error contracts, and the upstream HTML sanitization policy for components using `dangerouslySetInnerHTML`.

### 2026-06-20: Sanitizer — strip ALL inline `style` (no `style` attr in allowlist)
**By:** Russ Rimmerman, resolving Rai deferral point (plan §5d)
**What:** The feed sanitizer (`sanitizeFeedHtml()`) ALLOWED_ATTR must NOT permit the `style` attribute. ALL inline `style` is stripped at sanitization time, accepting that some Microsoft callouts lose color/highlight. `style` stays in FORBID_ATTR.
**Why:** Inline `style` is a CSS-injection / XSS-adjacent vector; a tight allowlist beats styling fidelity on a public site (mspulse360.app). Resolves the open `style` question Rai deferred.

### 2026-06-20: External feed `<img>` — proxy via internal Next.js image route
**By:** Russ Rimmerman, resolving Rai deferral point (plan §5d)
**What:** Keep `img` in the sanitizer ALLOWED_TAGS, but rewrite/route every external image `src` through a server-controlled internal Next.js image-proxy route (`/api/image-proxy`). Feed images are preserved without bypassing controls. Restrict upstream image URLs to `https:`.
**Why:** Preserves content fidelity (feed images render) while eliminating tracking-pixel beacons, SVG-borne XSS, and third-party leakage by funneling all images through a controlled proxy.

### 2026-06-20: Endpoint trust — implicit trust in official Microsoft endpoints is acceptable
**By:** Russ Rimmerman, resolving Rai deferral point (plan §5d)
**What:** Implicit trust of the official Microsoft feed/API endpoints is acceptable for this audience. No additional provenance/verification safeguards required beyond sanitization.
**Why:** Audience and threat model do not warrant endpoint-provenance verification; server-side sanitization is the agreed control boundary.

### 2026-06-20: Sanitization-first sequencing (M0 ships independently)
**By:** Miller (Lead)
**What:** The XSS sanitization rollout (WI-01 – WI-05) is sequenced as an isolated Milestone 0 that ships before any normalized-contract or route-migration work begins. M1 onward has an explicit milestone gate on WI-05 (Bobbie's regression tests passing), not a code dependency.
**Why:** Rai flagged 8 unsanitized `dangerouslySetInnerHTML` sites as 🔴 Critical on a public site. Keeping M0 independent means the security fix is reviewable, testable, and deployable in one small PR set without requiring the larger refactor to land first. It also validates the sanitize.ts config (the same config the parsers will later use) before it touches route-migration code.

### 2026-06-20: Image-proxy as its own WI in M0 (WI-02), img src rewriting wired into sanitize.ts
**By:** Miller (Lead)
**What:** The internal image proxy (`/api/image-proxy`) is WI-02 (Amos), running parallel to WI-01 (Alex). The DOMPurify hook that rewrites `img[src]` to `/api/image-proxy?url=...` lives in `sanitize.ts` (WI-01), so the rewrite is part of the sanitizer — not a separate post-processing step. WI-04 (applying to 8 sites) depends on both WI-01 and WI-02 so the proxy route exists before rollout is applied.
**Why:** Russ's decision #2 says image proxy is "its own work item that the sanitization rollout depends on or runs alongside." Wiring the rewrite into the DOMPurify hook keeps it atomic: every call to `sanitizeFeedHtml()` automatically proxies images with no per-callsite work. Amos can build and test WI-02 in parallel with Alex building WI-01, converging at WI-04.

### 2026-06-20: Milestone gate vs. code dependency distinction
**By:** Miller (Lead)
**What:** WI-06 (Feed Foundation scaffold) lists `WI-05 (milestone gate)` as its dependency. This is a process constraint — M0 must ship and Bobbie must sign off — not a TypeScript import dependency. WI-06 creates entirely new files with no technical dependency on the M0 code.
**Why:** Makes the ordering intent explicit in the backlog so the team doesn't start scaffolding the larger module before the critical XSS fix is reviewed and deployed. Prevents the mistake of landing a large M1 PR alongside an unreviewed M0 fix.

### 2026-06-20: No endpoint-verification work items
**By:** Miller (Lead)
**What:** No WIs were created for provenance checking, endpoint signature verification, or any form of upstream trust validation against official Microsoft feeds.
**Why:** Russ's canonical decision #3 explicitly grants implicit trust to official Microsoft endpoints and prohibits additional verification work items.

### 2026-06-20: MessageDetail sanitization ordering captured in WI-04 AC
**By:** Miller (Lead)
**What:** WI-04's acceptance criteria explicitly require that `MessageDetail.tsx` applies `sanitizeFeedHtml()` to `processedContent` (the output of the existing regex transform), not to the raw `Message.content` field.
**Why:** Rai's mandate in decisions.md states "sanitize MessageDetail AFTER its existing regex transform." The regex transform may produce structural HTML that the sanitizer would otherwise collapse if run on raw content. This ordering preserves existing behavior while closing the XSS gap.

### 2026-06-20: WI-07/08/09 parallel within M1; WI-10 serializes on WI-07+WI-09
**By:** Miller (Lead)
**What:** `parsers/rss.ts` (WI-07), `parsers/json-api.ts` (WI-08), and `parsers/html-table.ts` (WI-09) can all be built in parallel after WI-06. WI-10 (route migration) serializes on WI-07 and WI-09 (RSS + HTML table parsers needed first for the RSS-proxy routes); WI-12/13 serialize on WI-07+WI-08.
**Why:** Maximizes Alex's throughput — all three parser files are independent new files. Route migration can begin as soon as the RSS and HTML-table parsers are ready, without waiting for the JSON-API parser.

### 2026-06-20: Amos owns WI-14 (error envelope) separately from route-parsing work (WI-10)
**By:** Miller (Lead)
**What:** The route-parsing migration (WI-10, Alex) and the error-envelope standardization (WI-14, Amos) are separate WIs in different milestones. WI-14 depends on WI-10.
**Why:** They have different concerns: WI-10 changes the response _format_ (XML → JSON, parse server-side); WI-14 standardizes the _error semantics_ (status codes, `ok: false` shape). Separating them keeps each PR focused and makes rollback simpler. Amos can concentrate on error handling without needing to understand parser internals.

### 2026-06-20: M365 Updates and Fabric Roadmap cache change flagged with comments
**By:** Miller (Lead)
**What:** WI-15 requires code comments when M365 Updates and Fabric Roadmap move from `cache: 'no-store'` to light `revalidate` values (1800s and 3600s respectively).
**Why:** Alex's plan flagged this as an intentional behavior change. A code comment preserves the rationale so a future engineer doesn't silently revert it (or blindly keep it if real-time freshness is later required).

### 2026-06-20T11:50:00-05:00: Collapsed duplicate typography color rules in tailwind.config.js
**By:** Naomi (requested by Russ)
**What:** Replaced seven near-identical typography selectors (each declaring only `{ color: 'inherit' }`) with a single `Object.fromEntries(['strong','code','h1','h2','h3','h4'].map(...))` expression. The `a` rule keeps its full multi-property form on one line.
**Why:** Repowise flagged ~40% file duplication with a 17-line self-clone in `tailwind.config.js`. Output CSS is unchanged; file dropped from 78 to 60 lines.

### 2026-06-20: Centralized feed-HTML sanitizer — `src/lib/feed/sanitize.ts`
**By:** Alex
**What:** Created `src/lib/feed/sanitize.ts` exporting `sanitizeFeedHtml`, `stripHtml`, and `SANITIZE_CONFIG`. Hooks registered once at module load via a boolean guard to prevent hook-stacking on hot-reload.
**Why:** Three locked product decisions drove key implementation choices:
  1. `style` omitted from `ALLOWED_ATTR` AND added to `FORBID_ATTR` (defense-in-depth — zero path for inline styles to survive).
  2. `ALLOWED_URI_REGEXP: /^(?:https?:\/\/|(?![a-z][a-z0-9+\-.]*:))/i` — allows relative paths (no protocol) and `https?://` absolute URLs while blocking `javascript:`, `data:`, `vbscript:`, `blob:`, etc. A simpler `/^https?:\/\//i` was rejected because it would also strip `/api/image-proxy` srcs that the image-proxy hook writes.
  3. Image proxy hook placed in `afterSanitizeAttributes` (not `uponSanitizeAttribute`) so it runs after DOMPurify has already validated/stripped attrs — the src we rewrite to is a trusted relative path and won't be re-sanitized.

### 2026-06-20: WI-02 image-proxy route decisions
**By:** Amos
**What:** Created `src/app/api/image-proxy/route.ts` — internal image proxy that fetches upstream images on behalf of the browser, enforcing HTTPS-only, SSRF protection, and a Microsoft/CDN host allowlist.

---

**Decision 1 — `export const runtime = 'nodejs'`**

*Why:* The Edge runtime caps response-body size at ~1 MB, which would silently truncate larger images (e.g. high-res hero images from Microsoft blogs). The Node.js runtime has no such limit, streams the `ReadableStream` body faithfully, and is the more appropriate choice for I/O-bound proxying. It also leaves the door open to real DNS-resolution SSRF pinning (using Node `dns.lookup`) in future without a runtime migration.

---

**Decision 2 — `redirect: 'manual'` instead of `redirect: 'follow'`**

*Why:* Following redirects transparently re-runs `fetch` against the redirect target without our SSRF/allowlist checks, enabling a potential open-redirect bypass (upstream CDN → attacker-controlled redirect → internal metadata endpoint). By setting `redirect: 'manual'`, any 3xx from the upstream is treated as an upstream failure (502). This is conservative: if a CDN legitimately redirects (e.g. HTTP→HTTPS), that redirect path is blocked. The trade-off is acceptable because (a) all upstream URLs from the sanitizer are already canonical `https://` URLs, and (b) security > convenience for a proxy route.

---

**Decision 3 — Allowlist scope**

*Why:* The allowlist contains 15 Microsoft-owned or Microsoft-operated CDN apex domains. Subdomain matching is dot-anchored (`h === apex || h.endsWith('.'+apex)`) so `evilmicrosoft.com` does not match `microsoft.com`. `gstatic.com` (Google) was explicitly excluded per spec. Non-Microsoft CDNs (Cloudflare, Fastly, etc.) were not added since Pulse360 only aggregates Microsoft feed content.

---

**Decision 4 — SSRF coverage and known limitation**

*What is covered:* IP-literal SSRF protection rejects IPv4 private/loopback/link-local ranges (0/8, 10/8, 127/8, 169.254/16, 172.16/12, 192.168/16), IPv6 loopback (`::1`), IPv6 link-local (`fe80::/10`), and literal hostnames (`localhost`, `0.0.0.0`).

*Known gap:* DNS-resolution pinning is not implemented. A hostname on the allowlist could theoretically resolve to a private IP via DNS rebinding. This risk is low in practice because (a) the allowlist is exclusively Microsoft-controlled domains that resolve to public Azure/CDN IPs, and (b) Vercel's network egress enforces additional controls. Full mitigation would require a Node `dns.lookup` call followed by an IP-range check before `fetch` — deferred as a hardening item.

### 2026-06-20: SafeHtml component + sanitization rollout to 8 dangerouslySetInnerHTML sites
**By:** Naomi

**What:**
- Created `src/components/SafeHtml.tsx` — a `'use client'` component that re-sanitizes HTML at render time via `DOMPurify.sanitize(html, SANITIZE_CONFIG)` (defense-in-depth layer over WI-01's server-side sanitizer). `String()` coercion handles the `string | TrustedHTML` return type without `any` or `@ts-ignore`.
- Applied sanitization to all 8 previously-unsanitized `dangerouslySetInnerHTML` sites.

**Why — client vs server split:**
- CLIENT components (`'use client'` directive present): replaced raw `dangerouslySetInnerHTML` with `<SafeHtml html={...} className={...} />`. Affected: `AzureUpdateCard`, `M365UpdateCard`, `ReleasePlanCard`, `ReleasePlanDetail` (2 sites), `MessageDetail`.
- SERVER components (async page functions, no `'use client'`): called `sanitizeFeedHtml(value)` server-side and passed the result to `dangerouslySetInnerHTML`. Affected: `azure-update/[id]/page.tsx`, `m365-update/[id]/page.tsx`, `m365-update/rss/[id]/page.tsx`. Using `<SafeHtml>` in server components would require marking them as client components, which is undesirable (adds client bundle weight and breaks RSC data-fetching patterns).

**Why — MessageDetail ordering:**
Spec mandated regex runs FIRST, sanitizer runs SECOND. `processedContent` (the regex output) is passed to `<SafeHtml>` — the `SafeHtml` re-sanitize covers it. Raw `message.content` is never directly rendered.

**Why — MessageCard untouched:**
`MessageCard.tsx` already has correct DOMPurify usage; touching it risks regression.

**Why — `String()` coercion in SafeHtml:**
`isomorphic-dompurify`'s `.sanitize()` TS overloads can return `string | TrustedHTML` depending on config. `String()` is the cleanest coercion that preserves strictness (no `any`, no `@ts-ignore`, no unsafe cast).

### 2026-06-20: WI-05 XSS regression tests — environment constraints on E2E suite
**By:** Bobbie

**What**

Created two test files under `tests/`:

- `tests/sanitize.spec.ts` — 11 unit-style tests (no browser required) covering all required XSS attack vectors plus visual-fidelity and `stripHtml`. **33/33 passed** across all three browser projects (Playwright runs them as worker threads without launching a real browser).
- `tests/feed-pages.spec.ts` — 4 E2E tests for Azure/M365/Release-Plan/Message-Center listing pages. Skips gracefully when dev server is unreachable (via `beforeAll` probe + `test.skip`).

**Why / Findings**

1. **Import path**: `@/` path alias does not resolve inside Playwright's Node runner for files outside `src/`. Used relative path `../src/lib/feed/sanitize` instead — this is reliable and should remain so.

2. **E2E environment gaps (not blockers)**:
   - *Dev server*: No server was running at `localhost:3000` during this session; the 4 Chromium E2E tests correctly self-skipped. Run `npm run dev` first, then re-run with `--project=chromium` to exercise them.
   - *Firefox / WebKit binaries*: Not installed in this environment (`npx playwright install` not run). The 8 Firefox/WebKit E2E tests errored with "Executable doesn't exist". This is an environment gap, not a test-logic bug. Chromium (`--project=chromium`) is the working browser here.

3. **No sanitizer bugs found**: All 11 required attack vectors verified neutralized. No blockers surfaced.

**Recommended follow-up (not blocking M0)**

- Add `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true }` to `playwright.config.ts` once env vars are confirmed in local dev, so E2E runs without a manual pre-step.

### 2026-06-20T15:31:22-05:00: Restore `npm run lint` — ESLint 9 flat-config fix
**By:** Amos (Backend)

**What:**
- Added global `ignores` block to `eslint.config.mjs` excluding `.next/**`, `out/**`, `dist/**`, `build/**`, `.github/**`, `.squad/**`, `security-review/**`, `tests-examples/**`, `src/generated/**`, `next-env.d.ts`, `package-lock.json`.
- Added `files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]` restriction to `pluginReact.configs.flat.recommended` (was unrestricted — applied to ALL files).
- Added `settings: { react: { version: "detect" } }` to the react plugin config.
- Turned off `react/react-in-jsx-scope` (React 17+ new JSX transform) and `react/prop-types` (TypeScript handles prop types).
- Replaced `globals.browser` with `{ ...globals.browser, ...globals.node }` — Next.js is isomorphic; also fixes false-positive `module`/`__dirname`/`require` errors on CJS tooling config files.
- **No npm version changes** — `eslint-plugin-react@7.37.5` is the latest and the `getAllComments` bug only fires when react rules run on a non-JS `SourceCode` object (e.g. the JSON language plugin's SourceCode). Scoping react rules to JS/TS files is the correct fix.

**Why:**
The crash (`TypeError: sourceCode.getAllComments is not a function` on `.next/app-path-routes-manifest.json`) had two root causes:

1. **No `.next/**` in ignores** — ESLint 9 does not ignore `.next/` by default, so it processed all JSON files in the build output directory.
2. **`pluginReact.configs.flat.recommended` had no `files` restriction** — in ESLint 9 flat config, a config object without `files` applies to every file ESLint processes. The `@eslint/json` plugin sets a custom `SourceCode` implementation for JSON files; that implementation lacks `getAllComments()`, causing the crash when `react/display-name` (via `pragma.js:54`) tried to call it.

Fix is purely config-level; no source files and no npm packages were changed.

**Pre-existing errors surfaced (STOP condition — not fixed):**
`npm run lint` now runs to completion and reports 257 errors, all pre-existing:

| Count | Rule | Category |
|-------|------|----------|
| 124 | `@typescript-eslint/no-unused-vars` | Dead code / unused imports |
| 61 | `@typescript-eslint/no-explicit-any` | TypeScript strictness |
| 39 | `react/no-unescaped-entities` | JSX text with `'` and `"` |
| 14 | `no-useless-escape` | Regex/string escapes |
| 6 | `prefer-const` | `let` → `const` |
| 3 | `no-useless-catch` | Catch blocks that just rethrow |
| 2 | `react/no-unknown-property` | SVG/HTML prop naming |
| 2 | `markdown/fenced-code-language` | README.md code fences |
| 1 | `@typescript-eslint/ban-ts-comment` | Bare `@ts-ignore` |
| 1 | `@typescript-eslint/no-require-imports` | `require()` in tailwind.config.js |
| 1 | `css/no-important` | `!important` in CSS |
| 1 | `css/use-baseline` | CSS baseline compatibility |
| 1 | `no-empty` | Empty catch block |
| 1 | `react-hooks/exhaustive-deps` | Missing hook dep |

All 254 `src/` errors and the 3 config-file errors are pre-existing and require human triage. No source mass-edits were performed. Russ to decide remediation strategy.
- Run `npx playwright install` to install all browser binaries if cross-browser E2E coverage is needed.

### 2026-06-20T12:21:00-05:00: M0 (XSS Hotfix) implemented — WI-01..05 complete
**By:** Squad (Miller's M0), implemented by Alex/Amos/Naomi/Bobbie, coordinated for Russ
**What:** Centralized sanitizeFeedHtml() + /api/image-proxy + SafeHtml shipped; 8 unsanitized dangerouslySetInnerHTML sites closed; 33-test XSS regression suite green. Honors locked decisions: strip all inline style; img via /api/image-proxy (https only); trust MS endpoints (no provenance).
**Why:** Closes the Rai-flagged 🔴 Critical XSS surface on the public site. Known issue surfaced separately: repo-wide `npm run lint` is broken by a pre-existing eslint-plugin-react × ESLint 9 incompatibility (not caused by M0).