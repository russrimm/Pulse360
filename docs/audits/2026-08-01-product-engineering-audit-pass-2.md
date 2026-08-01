# Pulse360 Product Engineering Audit — Pass 2

Date: 2026-08-01  
Branch: `russrimm-russrimm-audit2-pulse360`

## Executive summary

This pass reviewed the work merged by audit pass 1, the Node 24 upgrade, every API route,
and the related feed, Message Center, lifecycle, Product News, navigation, test, and build
workflows.

No API route anonymously exposes tenant data under the default production configuration.
`/api/messages` fails closed when authentication is unconfigured, requires a NextAuth
session when authentication is configured, and becomes public only through the explicit
`MESSAGE_CENTER_PUBLIC=true` override. That override publishes tenant-scoped Microsoft 365
Message Center communications and remains an owner policy decision; this audit did not
change it.

The main implemented changes harden all sibling feed routes, prevent malformed Microsoft
payloads from dropping data or aborting database batches, make overlapping Message Center
syncs order-safe, remove Product News duplicate requests, correct date-only timezone shifts,
repair navigation/accessibility semantics, and replace unreliable external/unmanaged tests
with a managed cross-browser test server.

## Message Center and API authorization inventory

Microsoft Graph documents that
[`GET /admin/serviceAnnouncement/messages`](https://learn.microsoft.com/en-us/graph/api/serviceannouncement-list-messages?view=graph-rest-1.0)
returns **all service update messages that exist for the tenant**. The least-privileged
delegated and application permission is `ServiceMessage.Read.All`. The default page size is
100, `Prefer: odata.maxpagesize` can request at most 1,000, and callers must follow the
opaque `@odata.nextLink` supplied by Graph.

| Route                         | Production access                                                                             | Returned data                                                                                                                             | Anonymous tenant exposure                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/[...nextauth]`     | Anonymous authentication protocol endpoints                                                   | NextAuth sign-in, callback, session, and provider responses                                                                               | No Message Center rows; standard authentication metadata only                                                                 |
| `/api/messages`               | NextAuth session; 503 when auth is unconfigured; explicit `MESSAGE_CENTER_PUBLIC=true` bypass | Persisted Graph Message Center titles, HTML bodies, services, tags, dates, severity, details, and archive state for the configured tenant | **No by default. Yes when the owner explicitly enables public mode.** Responses are `private, no-store` and vary on `Cookie`. |
| `/api/cron/sync-messages`     | Constant-time bearer comparison against `CRON_SECRET`; 503 when missing in production         | Sync success flag and duration; initiates tenant Graph synchronization                                                                    | No data rows. Unauthorized callers cannot trigger Graph work under production defaults.                                       |
| `/api/author-feed`            | Anonymous                                                                                     | Public `blogs.microsoft.com` author RSS for a validated slug                                                                              | None                                                                                                                          |
| `/api/azure-ai-foundry-news`  | Anonymous                                                                                     | Public Microsoft Foundry developer-blog RSS                                                                                               | None                                                                                                                          |
| `/api/azure-ai-ml-news`       | Anonymous                                                                                     | Public Azure AI and machine-learning blog RSS                                                                                             | None                                                                                                                          |
| `/api/copilot-news`           | Anonymous                                                                                     | Public Microsoft Copilot blog RSS                                                                                                         | None                                                                                                                          |
| `/api/copilot-studio-news`    | Anonymous                                                                                     | Public Copilot Studio blog RSS                                                                                                            | None                                                                                                                          |
| `/api/fabric-blog-news`       | Anonymous                                                                                     | Public Microsoft Fabric community RSS                                                                                                     | None                                                                                                                          |
| `/api/image-proxy`            | Anonymous, HTTPS and Microsoft-controlled host allowlist                                      | Public image bytes from an allowed host                                                                                                   | None; SSRF-sensitive hosts and customer-provisionable storage/CDN hosts are rejected                                          |
| `/api/learn-blog-news`        | Anonymous                                                                                     | Public Microsoft Learn Tech Community RSS                                                                                                 | None                                                                                                                          |
| `/api/microsoft-news`         | Anonymous                                                                                     | Public Microsoft corporate blog RSS                                                                                                       | None                                                                                                                          |
| `/api/microsoft-news-authors` | Anonymous                                                                                     | Names, titles, slugs, and recent-post presence derived from the public Microsoft blog                                                     | None                                                                                                                          |
| `/api/mslifecycle`            | Anonymous                                                                                     | Public Microsoft Lifecycle export rows and source/cache metadata                                                                          | None                                                                                                                          |
| `/api/msrc`                   | Anonymous                                                                                     | Public Microsoft Security Response Center update and CVRF data                                                                            | None                                                                                                                          |
| `/api/power-apps-news`        | Anonymous                                                                                     | Public Power Apps blog RSS                                                                                                                | None                                                                                                                          |
| `/api/power-automate-news`    | Anonymous                                                                                     | Public Power Automate blog RSS                                                                                                            | None                                                                                                                          |
| `/api/power-bi-news`          | Anonymous                                                                                     | Public Power BI community RSS                                                                                                             | None                                                                                                                          |
| `/api/power-platform-news`    | Anonymous                                                                                     | Public Power Platform blog RSS                                                                                                            | None                                                                                                                          |
| `/api/proxy-rss`              | Anonymous, exact host allowlist and HTTPS only                                                | Public RSS from allowed Microsoft properties                                                                                              | None                                                                                                                          |
| `/api/semantic-kernel-news`   | Anonymous                                                                                     | Public Semantic Kernel developer-blog RSS                                                                                                 | None                                                                                                                          |
| `/api/tech-community-news`    | Anonymous                                                                                     | Public Microsoft Tech Community RSS                                                                                                       | None                                                                                                                          |

### Tenant boundary conclusions

- Production defaults are fail-closed. Smoke validation without authentication configuration
  returned 503 from both `/api/messages` and `/api/cron/sync-messages`.
- Anonymous Message Center access is possible only when the operator sets
  `MESSAGE_CENTER_PUBLIC=true`. Because Graph returns tenant-scoped communications, the owner
  must treat that setting as publication approval, not a convenience flag.
- When NextAuth is configured, any authenticated user accepted by the current tenant
  provider can read all persisted Message Center rows. There is no application role or group
  authorization layer, so guest/member restrictions remain an explicit owner decision.
- Message responses use `Cache-Control: private, no-store, max-age=0` and `Vary: Cookie`.
  Tenant rows are not eligible for shared CDN caching.
- No tenant identifier was found in the anonymous public-feed responses. Message Center
  content itself can identify products, rollout timing, incidents, and organizational action
  requirements even when a tenant GUID is absent.

## Material fixes

### Feed and upstream reliability

- Standardized 15-second upstream timeouts, cache policy, safe response headers, 5 MB
  incremental body limits, cancellation of oversized bodies, and 502 error behavior across
  sibling Microsoft feed routes.
- Fixed singleton RSS payloads: `fast-xml-parser` returns an object for one `<item>`, which
  previously produced an empty feed.
- Corrected Fabric JSON repair so legitimate escaped quotes do not corrupt escape-state
  tracking before later raw control characters.
- Accepted MSRC threat type values serialized as strings and retained partial Fabric results
  when another product-area source fails.

### Message Center integrity

- Added 15-second bounds to Graph requests and safe parsing for malformed optional Graph
  dates so one bad date cannot reject a 50-row Prisma transaction.
- Made archiving conditional on the synchronization start time.
- Made message refreshes conditional on both `lastSeenAt` and `archivedAt`, so an older
  overlapping process cannot reactivate a row archived by a newer process.
- Preserved the empty-Graph safety check that refuses to archive an existing active dataset
  after an unexpectedly empty upstream response.

### Product News and performance

- Replaced duplicate author metadata effects with a shared React Query key and removed the
  author-name-dependent feed refetch loop.
- Initial author-page work is now exactly **one** `/api/microsoft-news-authors` request and
  **one** `/api/author-feed` request. The prior call path performed two of each. A browser
  regression test asserts the new 4-to-2 request reduction in Chromium, Firefox, and WebKit.
- Author metadata fan-out now fetches each author's title and recent-feed status in parallel,
  is cached, is timeout-bounded, and returns explicit upstream failures.

### Dates, accessibility, SEO, and UX

- Parsed `YYYY-MM` and `YYYY-MM-DD` values as local calendar dates. Lifecycle tables no longer
  display the preceding day in time zones west of UTC, and countdowns use the same semantics.
- Fixed current-page navigation semantics and active indicators without incorrectly marking
  parent sections as the current page.
- Removed a duplicate Azure page heading, improved loading status text, and retained a single
  page-level heading.
- Removed redirect/noindex entries and tenant Message Center from the sitemap; added canonical
  release-plan and Product News entries.

### Test and CI reliability

- Added deterministic regression coverage for singleton feeds, chunked and known-length body
  limits, Fabric escape handling and partial failures, MSRC string threat types, Graph dates,
  local-calendar dates, lifecycle behavior, and Product News request deduplication.
- Playwright now owns a managed server, supports `PLAYWRIGHT_BASE_URL` for configured
  deployments, limits concurrency, and uses a production server for stable local
  cross-browser runs.
- Removed the scaffold test that tested `playwright.dev` instead of Pulse360.
- Removed `.github/workflows/quality.yml`; `.github/workflows/ci.yml` was a strict superset,
  so both workflows performed the same quality job on every change.

## Measurements and validation

### Baseline before changes

| Check                       | Result                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Deterministic Playwright    | 27 passed                                                                                                                    |
| Full Playwright             | 83 passed, 4 skipped, 21 failed; Firefox/WebKit were absent and lifecycle tests depended on an unmanaged server at port 3000 |
| TypeScript                  | Failed before Prisma generation; passed after `pnpm exec prisma generate`                                                    |
| ESLint                      | 0 errors, 108 warnings                                                                                                       |
| Clean production build      | Passed; 57 static pages; 66.56 seconds; `.next` 67,857,555 bytes                                                             |
| Production dependency audit | 2 high and 1 moderate advisories                                                                                             |
| Production smoke            | Public pages 200; Message Center and cron 503; malformed proxy/MSRC requests 400                                             |

### Final

| Check                       | Result                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic Chromium      | 34 passed                                                                                                                                                               |
| Full product Playwright     | 120 passed, 3 skipped, 0 failed across Chromium, Firefox, and WebKit; skips are the tenant-configured Message Center page                                               |
| Author request regression   | 3 passed across Chromium, Firefox, and WebKit; one metadata request and one feed request per engine                                                                     |
| TypeScript                  | Passed                                                                                                                                                                  |
| ESLint                      | Passed with 0 errors and 99 warnings (9 fewer warnings than baseline)                                                                                                   |
| Clean production build      | Passed; 57 static pages; 71.85 seconds; `.next` 69,838,538 bytes                                                                                                        |
| Production dependency audit | Unchanged: 2 high `brace-expansion` advisories through `exceljs`, 1 moderate `@hono/node-server` advisory through Prisma tooling                                        |
| Node 24 check               | Prisma generation/native dependencies and build passed; no deprecated Node API usage was found in application source; pending-deprecation script run emitted no warning |
| Production smoke            | `/` and `/home` 200; `/api/messages` 503 with private/no-store and `Vary: Cookie`; cron 503; missing RSS URL and malformed MSRC month ID 400                            |

The clean build was 5.29 seconds slower (+7.9%) and 1,980,983 bytes larger (+2.9%) than
baseline. Page count remained 57. Repeated test builds can grow `.next/cache` substantially,
so both figures above were captured after `pnpm clean`; the timing delta should not be treated
as a stable regression without repeated CI samples.

## Remaining recommendations

### P0

1. **Verify the production value of `MESSAGE_CENTER_PUBLIC`.** Leave it unset/false unless the
   owner explicitly approves publishing all tenant Message Center communications. This must be
   checked in the deployment environment by an authorized owner; no credentials or cloud
   configuration were accessed during this audit.

### P1

1. Decide whether all authenticated tenant users, including guests accepted by the provider,
   should read Message Center data. If not, define the Entra group/app-role policy before code
   enforcement is added.
2. Review and update the `exceljs`/`archiver` dependency path that retains two high
   `brace-expansion` advisories. The vulnerable glob expansion is not directly exposed by the
   current lifecycle import path, but the advisories remain in production resolution.
3. Update Prisma when its tooling resolves the transitive `@hono/node-server` Windows
   traversal advisory. The affected development server is not used to serve application
   static files in production.
4. Add a database-backed sync lease if operators expect multiple independent schedulers or
   long-running concurrent syncs. Timestamp guards now protect row state, but a lease would
   also avoid duplicate Graph traffic.

### P2

1. Add structured telemetry for feed timeout, oversize rejection, stale-cache use, Graph page
   count, sync archive/reactivation counts, and partial Fabric failures.
2. Split remaining broad client components where measurement shows hydration cost; no
   approval-free architectural rewrite was justified in this pass.
3. Burn down the 99 pre-existing ESLint warnings, prioritizing hook dependency and unused-code
   warnings over cosmetic churn.

## Owner-only security actions

- Inspect production environment variables and confirm `MESSAGE_CENTER_PUBLIC` is absent or
  explicitly approved.
- Review the Entra app registration: retain only `ServiceMessage.Read.All`, confirm the
  intended tenant, and verify secret/certificate ownership and expiry. No evidence required an
  emergency credential rotation.
- Decide the tenant member/guest/group authorization policy and document who is permitted to
  read tenant communications.
- Verify `CRON_SECRET` is configured in production and owned through the normal secret
  rotation process.

## Constraints and areas with no safe change

- Authentication policy, tenant role policy, credential rotation, and deployment settings were
  not changed because they require owner approval.
- No cloud or tenant resource was queried or modified.
- The Node 24 upgrade was already merged. Application source contained no deprecated Node API
  usage, native dependency generation succeeded, and no runtime/CI mismatch remained.
- The remaining dependency advisories require upstream/dependency decisions; no safe lockfile
  override was introduced without validating the full transitive consumers.

## Evidence reviewed

- Pass-1 commits `7875b0d`, `6f09b6e`, `54f5b96`, and `41a1035`.
- Repository pull requests
  [#144](https://github.com/russrimm/Pulse360/pull/144),
  [#157](https://github.com/russrimm/Pulse360/pull/157), and
  [#158](https://github.com/russrimm/Pulse360/pull/158).
- Microsoft Graph
  [List serviceAnnouncement messages](https://learn.microsoft.com/en-us/graph/api/serviceannouncement-list-messages?view=graph-rest-1.0).
