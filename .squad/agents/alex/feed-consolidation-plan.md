# Feed Consolidation & Data Layer Roadmap

**Author:** Alex (Data / Integrations Engineer)  
**Date:** 2026-06-20  
**Status:** PROPOSAL — awaiting Miller review  

---

## 1. Feed / Ingestion Survey

### 1a. Route Handler Inventory (18 routes under `src/app/api/`)

| Route | Upstream Source | Parser | Response Format | Error Shape |
|---|---|---|---|---|
| `/api/power-apps-news` | `powerapps.microsoft.com/en-us/blog/feed` (RSS) | None (raw proxy) | Raw XML | `200 { items: [] }` |
| `/api/power-platform-news` | `microsoft.com/en-us/power-platform/blog/feed` (RSS) | None (raw proxy) | Raw XML | `200 { items: [] }` |
| `/api/power-automate-news` | `flow.microsoft.com/en-us/blog/feed` (RSS) | None (raw proxy) | Raw XML | `200 { items: [] }` |
| `/api/power-bi-news` | `powerbi.microsoft.com/en-us/blog/feed` (RSS) | None (raw proxy) | Raw XML | `200 { items: [] }` |
| `/api/copilot-news` | `microsoft.com/en-us/microsoft-copilot/blog/feed/` (RSS) | None (raw proxy) | Raw XML | `200 { items: [] }` |
| `/api/copilot-studio-news` | `learn.microsoft.com/.../planned-features` (HTML) | None (raw proxy) | Raw HTML | `200 { items: [] }` |
| `/api/learn-blog-news` | `techcommunity.microsoft.com/.../MicrosoftLearnBlog` (RSS) | None (raw proxy) | Raw XML | `500 plain text` |
| `/api/microsoft-news` | `blogs.microsoft.com/feed/` (RSS) | None (raw proxy) | Raw XML | `500 plain text` |
| `/api/tech-community-news` | `techcommunity.microsoft.com/.../Community` (RSS) | None (raw proxy) | Raw XML | `500 plain text` |
| `/api/fabric-blog-news` | `blog.fabric.microsoft.com/en-us/blog/feed/` (RSS) | **xml2js** (`parseStringPromise`) | JSON (parsed) | `500 { error, details }` |
| `/api/semantic-kernel-news` | `devblogs.microsoft.com/semantic-kernel/feed/` (RSS) | None (raw proxy) | Raw XML | `500 plain text` |
| `/api/azure-ai-foundry-news` | `devblogs.microsoft.com/foundry/feed/` (RSS) | None (raw proxy) | Raw XML | `500 plain text` |
| `/api/azure-ai-ml-news` | `azure.microsoft.com/.../ai-machine-learning/feed/` (RSS) | **rss-parser** | JSON (parsed) | `500 { error }` |
| `/api/msrc` | `api.msrc.microsoft.com/cvrf/v3.0/` (JSON API) | None (JSON passthrough) | JSON | `res.status { error }` |
| `/api/messages` | Graph API via `api.server.ts` (JSON API) | None (JSON) | JSON | `500 { error, detail }` |
| `/api/proxy-rss` | Dynamic (allowlisted hosts, RSS) | None (raw proxy) | Raw XML | `400/403/500/502 plain text` |
| `/api/microsoft-news-authors` | `blogs.microsoft.com/feed/` + author pages | Regex on XML + HTML scraping | JSON | `200 []` (empty on error) |
| `/api/author-feed` | `blogs.microsoft.com/blog/author/{slug}/feed/` | None (raw proxy) | Raw XML | (no error handling) |

### 1b. Client-Side Parsers (`src/lib/api.client.ts`)

| Function | Calls Route | Parser Used | Output Type |
|---|---|---|---|
| `getPowerAppsNews` | `/api/power-apps-news` | **fast-xml-parser** | `ProductNews[]` |
| `getPowerPlatformNews` | `/api/power-platform-news` | **fast-xml-parser** | `ProductNews[]` |
| `getPowerAutomateNews` | `/api/power-automate-news` | **fast-xml-parser** | `ProductNews[]` |
| `getPowerBINews` | `/api/power-bi-news` | **fast-xml-parser** | `ProductNews[]` |
| `getCopilotNews` | `/api/copilot-news` | **fast-xml-parser** | `ProductNews[]` |
| `getCopilotStudioNews` | `/api/copilot-studio-news` | **Regex (HTML table scraping)** | `ProductNews[]` |
| `getLearnBlogNews` | `/api/learn-blog-news` | **fast-xml-parser** | `ProductNews[]` |
| `getMicrosoftNews` | `/api/microsoft-news` | **DOMParser** (browser API) | `ProductNews[]` |
| `getTechCommunityNews` | `/api/tech-community-news` | **DOMParser** (browser API) | `ProductNews[]` |
| `getFabricBlogNews` | `/api/fabric-blog-news` | None (JSON response) | `ProductNews[]` |
| `getSemanticKernelNews` | `/api/semantic-kernel-news` | **fast-xml-parser** | `ProductNews[]` |
| `getAzureAIFoundryNews` | `/api/azure-ai-foundry-news` | **fast-xml-parser** | `ProductNews[]` |

### 1c. Server-Side Fetchers (`src/lib/api.server.ts`)

| Function | Upstream Source | Parser | Output Type |
|---|---|---|---|
| `getMessages` | Graph `/admin/serviceAnnouncement/messages` (JSON API) | None (JSON) | `Message[]` |
| `getMessage` | Graph by ID filter (JSON API) | None (JSON) | `Message \| null` |
| `getReleasePlans` | `releaseplans.microsoft.com/.../allreleaseplans/` (JSON API) | None (JSON) | ad-hoc shape (untyped) |
| `getAzureUpdates` | `microsoft.com/releasecommunications/api/v2/azure` (JSON API) | None (JSON) | `AzureUpdate[]` |
| `getM365Updates` | `microsoft.com/releasecommunications/api/v2/m365` (JSON API) | None (JSON) | `M365Update[]` |
| `getM365Update` | `microsoft.com/.../m365/rss/{id}` (RSS/XML) | **fast-xml-parser** + regex scraping | `M365Update \| null` |

### 1d. Page-Level Fetchers (inline, not in a shared lib)

| File | Upstream | Parser | Output |
|---|---|---|---|
| `src/app/release-plans/fabric/page.tsx` | `releaseplanner.azure-api.net/fabric/...` (JSON API) | None (JSON) | local `FabricRoadmapItem` → mapped |
| `src/app/product-news/all-things-azure/page.tsx` | `devblogs.microsoft.com/all-things-azure/feed/` (RSS) | **xml2js** (`parseStringPromise`) | `ProductNews[]` |

### 1e. Shared Lib (`src/lib/fabricApi.ts`)

| Function | Upstream | Parser | Output |
|---|---|---|---|
| `getFabricRoadmap` | `releaseplanner.azure-api.net/fabric/...` (JSON API) | None (JSON) | `FabricRoadmapItem[]` |

### Parser Summary

| Parser | Package | Where Used | Count |
|---|---|---|---|
| `fast-xml-parser` | `fast-xml-parser@^5.3.3` | `api.client.ts` (8 fns), `api.server.ts` (1 fn) | **9** |
| `DOMParser` | Browser built-in | `api.client.ts` (2 fns) | **2** |
| `xml2js` | `xml2js@^0.6.2` | `fabric-blog-news/route.ts`, `all-things-azure/page.tsx` | **2** |
| `rss-parser` | `rss-parser@^3.13.0` | `azure-ai-ml-news/route.ts` | **1** |
| Regex/HTML scraping | N/A | `api.client.ts` (`getCopilotStudioNews`), `api.server.ts` (`getM365Update`), `microsoft-news-authors/route.ts` | **3** |

---

## 2. Proposed Centralized Ingestion Module

### Module: `src/lib/feed/index.ts`

**API surface:**

```typescript
// src/lib/feed/types.ts
export type FeedSource =
  | 'message-center'       // Graph API
  | 'azure-updates'        // Release Communications JSON API
  | 'm365-updates'         // Release Communications JSON API
  | 'release-plans'        // releaseplans.microsoft.com JSON API
  | 'fabric-roadmap'       // releaseplanner.azure-api.net JSON API
  | 'msrc'                 // MSRC CVRF JSON API
  | 'power-apps'           // RSS
  | 'power-platform'       // RSS
  | 'power-automate'       // RSS
  | 'power-bi'             // RSS
  | 'copilot'              // RSS
  | 'copilot-studio'       // HTML scraping
  | 'learn-blog'           // RSS
  | 'microsoft-blog'       // RSS
  | 'tech-community'       // RSS
  | 'fabric-blog'          // RSS
  | 'semantic-kernel'      // RSS
  | 'azure-ai-foundry'     // RSS
  | 'azure-ai-ml'          // RSS
  | 'all-things-azure'     // RSS
  | 'author-feed';         // RSS (per-author)

export interface NormalizedUpdate {
  /** Stable unique ID from source (GUID, message ID, or hashed link) */
  id: string;
  /** Source feed identifier */
  source: FeedSource;
  /** Human-readable title */
  title: string;
  /** Plain-text summary / excerpt (HTML stripped) */
  summary: string;
  /** Sanitized HTML content for detail views (DOMPurify-cleaned) */
  contentHtml: string;
  /** ISO 8601 publish / created date */
  publishedAt: string;
  /** ISO 8601 last-modified date (falls back to publishedAt) */
  updatedAt: string;
  /** Canonical URL to the source item */
  url: string;
  /** Author / creator name */
  author: string;
  /** Product/service tags (normalized) */
  products: string[];
  /** Category / topic tags */
  tags: string[];
  /** Current status (GA, Preview, In Development, etc.) */
  status?: string;
  /** Source-specific metadata that doesn't fit the normalized shape */
  meta?: Record<string, unknown>;
}

// src/lib/feed/index.ts
export { parseRssFeed } from './parsers/rss';
export { parseJsonApi } from './parsers/json-api';
export { parseHtmlTable } from './parsers/html-table';
export { sanitizeHtml } from './sanitize';
export { FEED_SOURCES, CACHE_TTL } from './config';

// src/lib/feed/parsers/rss.ts — single RSS parser using fast-xml-parser
export function parseRssFeed(xml: string, source: FeedSource): NormalizedUpdate[];

// src/lib/feed/parsers/json-api.ts — normalize JSON API responses
export function parseJsonApi(data: unknown, source: FeedSource): NormalizedUpdate[];

// src/lib/feed/parsers/html-table.ts — Copilot Studio HTML table scraping
export function parseHtmlTable(html: string): NormalizedUpdate[];
```

**Design notes:**
- **Standardize on `fast-xml-parser`** for all RSS/XML. Drop `xml2js` and `rss-parser` as dependencies. `DOMParser` (browser-only) replaced by isomorphic `fast-xml-parser`.
- Each parser returns `NormalizedUpdate[]` — source-specific mapping happens in the parser, not the consumer.
- `sanitizeHtml()` is called inside parsers so all `contentHtml` is pre-sanitized at ingestion time.

---

## 3. Cache Contract

### 3a. Current Cache Behavior (verified from code)

| Source | List Cache | Detail Cache | Mechanism |
|---|---|---|---|
| Message Center (Graph) | `revalidate: 3600` (1h) | `revalidate: 86400` (24h) | `next: {}` on fetch |
| Azure Updates (JSON API) | `revalidate: 3600` (1h) | page-level `revalidate = 3600` | `next: {}` / page export |
| M365 Updates (JSON API) | `cache: 'no-store'` (0) | `cache: 'no-store'` (0) | fetch opt |
| Release Plans (JSON API) | None (default) | N/A | No cache directive |
| Fabric Roadmap (JSON API) | `cache: 'no-store'` (0) | N/A | fetch opt |
| MSRC (JSON API) | None (default) | None (default) | No cache directive |
| RSS proxy routes (×12) | `revalidate: 3600` (1h) | N/A | `next: {}` on upstream fetch |
| RSS client-side parsing | `revalidate: 3600` (1h) | N/A | `next: {}` on route fetch |
| `proxy-rss` (dynamic) | None (upstream) | N/A | Response header `s-maxage=600` |
| All Things Azure (page) | `revalidate: 1800` (30m) | N/A | `next: {}` on fetch |
| Fabric Blog (route) | `revalidate: 3600` (1h) | N/A | `next: {}` on fetch |

### 3b. Proposed Centralized TTL Config

```typescript
// src/lib/feed/config.ts

export const CACHE_TTL: Record<FeedSource, { list: number; detail: number }> = {
  'message-center':    { list: 3600,  detail: 86400 },  // 1h list, 24h detail
  'azure-updates':     { list: 3600,  detail: 3600  },  // 1h both
  'm365-updates':      { list: 1800,  detail: 1800  },  // 30m (currently no-store; propose light cache)
  'release-plans':     { list: 3600,  detail: 86400 },  // 1h list, 24h detail (data changes infrequently)
  'fabric-roadmap':    { list: 3600,  detail: 3600  },  // 1h (currently no-store; propose light cache)
  'msrc':              { list: 3600,  detail: 86400 },  // 1h list, 24h detail
  'power-apps':        { list: 3600,  detail: 3600  },
  'power-platform':    { list: 3600,  detail: 3600  },
  'power-automate':    { list: 3600,  detail: 3600  },
  'power-bi':          { list: 3600,  detail: 3600  },
  'copilot':           { list: 3600,  detail: 3600  },
  'copilot-studio':    { list: 3600,  detail: 3600  },
  'learn-blog':        { list: 3600,  detail: 3600  },
  'microsoft-blog':    { list: 3600,  detail: 3600  },
  'tech-community':    { list: 3600,  detail: 3600  },
  'fabric-blog':       { list: 3600,  detail: 3600  },
  'semantic-kernel':   { list: 3600,  detail: 3600  },
  'azure-ai-foundry':  { list: 3600,  detail: 3600  },
  'azure-ai-ml':       { list: 3600,  detail: 3600  },
  'all-things-azure':  { list: 1800,  detail: 3600  },
  'author-feed':       { list: 3600,  detail: 3600  },
};

// Helper for route handlers:
export function fetchOptions(source: FeedSource, view: 'list' | 'detail' = 'list') {
  return { next: { revalidate: CACHE_TTL[source][view] } };
}
```

**Behavior change flag:** M365 Updates and Fabric Roadmap move from `no-store` to a light cache (1800s/3600s). This is intentional — `no-store` on every request is a performance risk for serverless. If real-time freshness is required, these can be overridden back to `0`.

---

## 4. Error Contract

### 4a. Current Error Semantics (per route)

| Error Pattern | Routes Using It |
|---|---|
| `200 { items: [] }` (success shape, error swallowed) | power-apps, power-platform, power-automate, power-bi, copilot, copilot-studio |
| `500` with plain text body | learn-blog, microsoft-news, tech-community, semantic-kernel, azure-ai-foundry |
| `500 { error: string, details?: string }` | fabric-blog, azure-ai-ml |
| `500 { error: string, detail: string }` | messages |
| `<status> { error: string }` | msrc (mirrors upstream status) |
| `400/403/500/502` with plain text | proxy-rss |
| `200 []` (empty array on error) | microsoft-news-authors |
| No error handling | author-feed |

### 4b. Proposed Unified Error/Response Envelope

```typescript
// src/lib/feed/envelope.ts

/** Success response */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  /** ISO 8601 timestamp of when data was fetched/cached */
  fetchedAt: string;
  /** Source identifier for debugging */
  source: FeedSource;
}

/** Error response */
export interface ApiError {
  ok: false;
  error: {
    code: string;       // machine-readable: 'UPSTREAM_UNAVAILABLE', 'PARSE_ERROR', 'NOT_FOUND', etc.
    message: string;    // human-readable
    source: FeedSource;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

**HTTP Status Conventions:**

| Scenario | HTTP Status | `error.code` |
|---|---|---|
| Upstream feed unreachable / 5xx | `502 Bad Gateway` | `UPSTREAM_UNAVAILABLE` |
| XML/JSON parse failure | `502 Bad Gateway` | `PARSE_ERROR` |
| Missing/invalid query param | `400 Bad Request` | `INVALID_PARAMETER` |
| Resource not found (detail by ID) | `404 Not Found` | `NOT_FOUND` |
| Auth failure (Graph token) | `503 Service Unavailable` | `AUTH_FAILURE` |
| Host not in allowlist (proxy-rss) | `403 Forbidden` | `HOST_NOT_ALLOWED` |
| Unexpected error | `500 Internal Server Error` | `INTERNAL_ERROR` |

**Key change:** Routes MUST NOT return `200` with an empty array when the upstream is down — that's a silent data loss. `502` + error envelope lets the UI show a proper error state. Client code that currently checks `response.ok` and falls back to `[]` on `!ok` continues to work.

---

## 5. Sanitization Policy

### 5a. Current dangerouslySetInnerHTML Audit

| File | What's Rendered | Currently Sanitized? |
|---|---|---|
| `components/AzureUpdateCard.tsx:59` | `update.description` | ❌ **NO** |
| `components/M365UpdateCard.tsx:146` | `update.content` | ❌ **NO** |
| `components/ReleasePlanCard.tsx:159` | `plan.businessValue` | ❌ **NO** |
| `components/ReleasePlanDetail.tsx:200` | `plan.businessValue` | ❌ **NO** |
| `components/ReleasePlanDetail.tsx:206` | `plan.content` | ❌ **NO** |
| `components/MessageDetail.tsx:190` | `processedContent` (from Message.content) | ❌ **NO** |
| `app/m365-update/[id]/page.tsx:143` | `update.content` | ❌ **NO** |
| `app/m365-update/rss/[id]/page.tsx:58` | `update.content` | ❌ **NO** |
| `app/azure-update/[id]/page.tsx:133` | `update.description` | ❌ **NO** |
| `components/MessageCard.tsx:67,79` | Message preview text | ✅ **YES** — `isomorphic-dompurify` |

**Finding:** Only `MessageCard.tsx` sanitizes. All 9 other render sites pass upstream HTML directly into `dangerouslySetInnerHTML` with **zero sanitization**. This is the highest-priority security issue.

### 5b. Proposed Sanitization Policy

```typescript
// src/lib/feed/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

/** Allowed HTML tags for feed content rendering */
export const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'mark', 'small', 'sub', 'sup',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Links and media
    'a', 'img',
    // Block elements
    'blockquote', 'pre', 'code', 'hr', 'div', 'span',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    'width', 'height', 'colspan', 'rowspan',
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],            // Allow target for links
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
};

/** Sanitize HTML for safe rendering. Call at ingestion time (server-side). */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/** Strip all HTML — returns plain text. For summaries/excerpts. */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).replace(/\s+/g, ' ').trim();
}
```

### 5c. Where to Apply

**Recommendation: Server-side at ingestion time** (inside `parseRssFeed`, `parseJsonApi`, etc.), so all `contentHtml` in `NormalizedUpdate` is pre-sanitized. This provides defense-in-depth: even if a component forgets to sanitize, the data is already clean.

**Fallback safety net:** Add a thin client-side `SafeHtml` component wrapper (Naomi's responsibility) that re-sanitizes before rendering, as a second layer:

```typescript
// src/components/SafeHtml.tsx
'use client';
import DOMPurify from 'isomorphic-dompurify';
import { SANITIZE_CONFIG } from '@/lib/feed/sanitize';

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, SANITIZE_CONFIG) }} />;
}
```

### 5d. Rai Deferral Points

The following decisions are flagged for Rai's RAI content-safety review:

- **`ALLOWED_TAGS` / `ALLOWED_ATTR` final list** — Rai may recommend tighter restrictions (e.g., removing `img` to prevent tracking pixels, removing `a target` to prevent tab-nabbing).
- **`style` attribute** — currently in `FORBID_ATTR`. Rai should confirm whether inline `style` is acceptable with a limited allowlist (some feeds use inline styles for formatting).
- **Image rendering policy** — upstream feeds may include `<img>` tags with external `src`. Rai should weigh XSS risk (via SVG images) vs. content fidelity. Recommendation: keep `img` allowed but add `ALLOWED_URI_REGEXP` to restrict to `https:` only.
- **Link `target="_blank"`** — needs `rel="noopener noreferrer"` enforcement. Rai should confirm the `ADD_ATTR/FORCE_OUTPUT` approach.

---

## 6. Fabric Duplication Analysis

### What's Duplicated

`src/app/release-plans/fabric/page.tsx` reimplements the fetcher that exists in `src/lib/fabricApi.ts`:

| Aspect | `fabricApi.ts` (lib) | `release-plans/fabric/page.tsx` (page) |
|---|---|---|
| `FABRIC_API_BASE` | ✅ Defined | ✅ Redefined (identical value) |
| `FabricRoadmapItem` interface | ✅ Exported | ✅ Redefined (identical shape) |
| `getFabricRoadmap(productId)` | ✅ Exported | ✅ Redefined as local function (identical logic) |
| Cache behavior | `cache: 'no-store'` | `cache: 'no-store'` |
| `mapToReleasePlan()` transform | ❌ Not in lib | ✅ Page-local |
| Product ID constants | ❌ Not in lib | ✅ Hardcoded in page (11 product IDs) |

### What Diverged

Nothing has diverged yet — the duplication is a copy-paste that stayed in sync. But drift is inevitable.

### Proposed Collapse

1. Keep `getFabricRoadmap` in `src/lib/fabricApi.ts` (or move it into the new `src/lib/feed/` module).
2. Move the 11 product ID constants into `fabricApi.ts` as a `FABRIC_PRODUCT_IDS` map.
3. Add a `getAllFabricRoadmapItems()` function that calls `getFabricRoadmap` for all product IDs in parallel (the `Promise.all` pattern currently in the page).
4. Move `mapToReleasePlan()` into the lib — it maps `FabricRoadmapItem` to the release-plan display shape.
5. The page becomes a thin render shell: `const allPlans = await getAllFabricRoadmapItems(); return <FabricRoadmapContent allPlans={allPlans} />`.
6. Delete the local `FabricRoadmapItem` interface and local `getFabricRoadmap` from the page file.

**Risk:** Low — purely mechanical. No behavior change.

---

## 7. Prioritized Migration Roadmap

### Phase 1: Foundation (MUST come first)

| Step | Task | Owner | Risk | Files |
|---|---|---|---|---|
| 1.1 | **Create `src/lib/feed/` module structure** — `types.ts` (NormalizedUpdate, FeedSource), `config.ts` (CACHE_TTL, FEED_SOURCES), `sanitize.ts` (sanitizeHtml, stripHtml), `envelope.ts` (ApiSuccess, ApiError) | Alex | Low | New files |
| 1.2 | **Implement `sanitize.ts`** with DOMPurify config. Write unit tests. | Alex | Low | New file. Flag for Rai review. |
| 1.3 | **Implement `parsers/rss.ts`** — single RSS parser using fast-xml-parser, returning `NormalizedUpdate[]`. Cover RSS/Atom variants. | Alex | Medium — must handle all feed quirks | New file |
| 1.4 | **Implement `parsers/json-api.ts`** — normalizers for Graph, Release Communications, MSRC, Fabric Roadmap JSON shapes. | Alex | Medium | New file |
| 1.5 | **Implement `parsers/html-table.ts`** — Copilot Studio HTML table scraping (extracted from api.client.ts). | Alex | Low | New file |

### Phase 2: Migrate Routes onto Centralized Module

| Step | Task | Owner | Risk | Files |
|---|---|---|---|---|
| 2.1 | **Migrate RSS proxy routes** (12 routes) to use centralized fetcher + parser + error envelope. Routes that currently proxy raw XML should parse server-side and return JSON `ApiSuccess<NormalizedUpdate[]>`. | Alex (parser) + Amos (route plumbing) | Medium — changes response format from XML to JSON. Client code must be updated in tandem. | `src/app/api/*/route.ts` (12 files) |
| 2.2 | **Update `api.client.ts`** — replace per-source parser functions with single `fetchNormalizedFeed(source)` that consumes the new JSON response. Remove DOMParser/fast-xml-parser/xml2js usage from client. | Alex | Medium — behavior change for all product-news pages. | `src/lib/api.client.ts` |
| 2.3 | **Migrate server-side fetchers** in `api.server.ts` to use centralized parsers + error envelope + cache config. | Alex | Medium | `src/lib/api.server.ts` |
| 2.4 | **Migrate page-level fetchers** (`all-things-azure/page.tsx`, `release-plans/fabric/page.tsx`). | Alex | Low | 2 files |
| 2.5 | **Remove `xml2js` and `rss-parser` from package.json.** | Alex | Low — mechanical | `package.json` |

### Phase 3: Error & Cache Centralization

| Step | Task | Owner | Risk | Files |
|---|---|---|---|---|
| 3.1 | **Apply unified error envelope** across all `/api/*` routes. Update error responses from plain text / `{ items: [] }` to `ApiError` with appropriate HTTP status codes. | Amos (route plumbing) | Medium — behavior change for error paths. UI error handling must be updated. | All route files |
| 3.2 | **Apply centralized CACHE_TTL config** to all fetch calls. Remove hardcoded `revalidate` values. | Alex | Low — mechanical | All route + fetcher files |
| 3.3 | **Update client-side error handling** — UI components need to detect `{ ok: false }` error shape and show proper error states instead of empty lists. | Naomi (UI) | Medium | Component files |

### Phase 4: Sanitization Rollout

| Step | Task | Owner | Risk | Files |
|---|---|---|---|---|
| 4.1 | **Create `SafeHtml` component** — client-side DOMPurify wrapper for `dangerouslySetInnerHTML`. | Naomi (UI) | Low | New component |
| 4.2 | **Replace all 9 unsanitized `dangerouslySetInnerHTML` sites** with `<SafeHtml>` component. | Naomi (UI) | Low — mechanical, but must verify visual fidelity after sanitization strips unexpected tags. | 6 component/page files |
| 4.3 | **Get Rai sign-off** on ALLOWED_TAGS, image policy, link policy. Adjust sanitize config if needed. | Rai + Alex | Low risk to code; high importance for compliance | `sanitize.ts` |

### Phase 5: Fabric Dedup & Cleanup

| Step | Task | Owner | Risk | Files |
|---|---|---|---|---|
| 5.1 | **Collapse Fabric duplication** — move product IDs + `mapToReleasePlan` + `getAllFabricRoadmapItems` into `src/lib/fabricApi.ts` (or `src/lib/feed/`). Slim the page to a render shell. | Alex | Low — purely mechanical | `fabricApi.ts`, `release-plans/fabric/page.tsx` |
| 5.2 | **Remove `rss-parser` and `xml2js` deps** from package.json after all routes migrated. | Alex | Low | `package.json` |
| 5.3 | **Audit & archive `microsoft-news-authors` route** — currently scrapes HTML + regex. Assess if it should move to centralized module or remain bespoke. | Alex | Low — isolated, no downstream deps | 1 route file |

---

## 8. Summary of Key Architecture Decisions

1. **Normalized Contract (`NormalizedUpdate`)** — single typed interface for all feed sources, with `contentHtml` always pre-sanitized at ingestion.
2. **Error Envelope (`ApiResponse<T>`)** — discriminated union (`ok: true/false`) with machine-readable error codes and appropriate HTTP statuses. No more silent `200 []` on failures.
3. **Sanitization at Ingestion** — server-side DOMPurify sanitization at parse time + client-side `SafeHtml` component as defense-in-depth. Rai reviews ALLOWED_TAGS before final config.
4. **Single Parser: `fast-xml-parser`** — drop `xml2js`, `rss-parser`, and browser `DOMParser`. One parser, one config, one code path.
5. **Centralized Cache TTLs** — config map driving all `revalidate`/`cache` options, replaceable per-source.
