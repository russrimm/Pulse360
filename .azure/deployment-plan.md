# Azure deployment plan

Status: Deployed

Generated: 2026-11-05

## 1. Project overview

Deploy the existing Pulse360 Next.js application independently in tenant
`9a35777a-28ce-467a-92be-0cf503f7e030`.
Do not copy credentials, database connections, APIM endpoints, or telemetry
from source MCViewer or its tenant.

## 2. Requirements

- Preserve the server-backed application rather than convert to static export.
- Deploy public features now; keep Message Center fail-closed until destination
  tenant administrator setup, as explicitly selected by the user.
- Subscription: `ME-DIAx88967305-rurimmer-1`
  (`ad72197d-5fd1-4d98-b110-1b7fc6a87997`), user confirmed.
- Region: `centralus`, user confirmed.
- Scale: one small always-on application instance.
- Budget: a billable Basic B1 App Service plan, subject to plan approval.
- Do not provision a database or directory registrations for disabled features.
- Do not modify the existing portal360 application.

## 3. Components detected

| Component | Technology | Path |
|-----------|------------|------|
| Web UI and server rendering | Next.js 16, React 19 | `src/app` |
| Public API routes | Next.js route handlers | `src/app/api` |
| Optional Message Center | Graph, Prisma PostgreSQL, next-auth | `src/lib` |

Destination Microsoft 365 checks: enabled Microsoft 365 subscriptions were
returned by Graph. The current CLI identity received HTTP 403 from Message
Center and no active directory roles were returned. This does not establish
application access; administrator consent remains necessary before enabling it.

## 4. Recipe selection

Selected: Bicep.

Use explicit subscription-scoped CLI commands and a resource-group Bicep template
for two hosting resources. This avoids changing the user's default Azure context
and requires neither containers nor additional application dependencies.
Use Linux-native build tooling or App Service remote build for deployment;
do not ship Windows-native modules to Linux.

## 5. Architecture

| Component | Azure service | SKU |
|-----------|---------------|-----|
| Node.js 24 web server | Linux App Service | One instance |
| Hosting compute | Dedicated App Service plan | Basic B1 |

Resource group: `rg-pulse360` (confirmed absent).
New app and plan names will use a unique suffix.
Enforce HTTPS, TLS 1.2+, disable FTP/basic publishing authentication, and use
Entra-authenticated deployment. Preserve application security headers.
Set `MESSAGE_CENTER_PUBLIC=false`; omit Graph, database, and sign-in credentials.
Do not create RBAC assignments or copy legacy `NEXT_PUBLIC_*` settings.

## 6. Provisioning limit checklist

| Resource | Number to deploy | Usage after deployment | Limit | Source |
|----------|------------------|------------------------|-------|--------|
| Basic B1 workers | 1 | 1 | 11 | `az quota show` and `az quota usage show`, Microsoft.Web/centralus |
| App Service plans in new group | 1 | 1 | Covered by B1 worker capacity | New group; dedicated one-worker plan |
| Web apps on new plan | 1 | 1 | One app on dedicated B1 plan | Basic supports this single-app topology |

Linux B1 availability in Central US and Node.js 24 LTS runtime support were
verified using App Service CLI discovery. Regional B1 usage is 0 of 11.

## 7. Execution checklist

- [x] Inspect application and destination tenant.
- [x] Confirm subscription, region, and independence from the source tenant.
- [x] Confirm disabled Message Center scope.
- [x] Check hosting capacity.
- [x] Obtain approval of the hosting plan and billable resources.
- [x] Generate Bicep and reproducible application packaging configuration.
- [x] Finish Linux-native build and type checking; dependencies restored locally,
  lint passed with 86 existing warnings and zero errors.
- [x] Invoke azure-validate and run infrastructure validation/what-if.
- [x] All validation checks pass:
  - [x] Core validation: CLI, authentication, Bicep build, ARM validation, what-if.
  - [x] Bicep linting.
  - [x] Azure Policy validation.
- [x] Invoke azure-deploy and deploy the app.
- [x] Verify public pages, API health, security headers, and protected routes.

## 7. Validation proof

Validated by: azure-validate skill workflow.

| Check | Command run | Result | Timestamp (UTC) |
|-------|-------------|--------|-----------------|
| Application lint | `pnpm lint` | Pass; 0 errors, 86 pre-existing warnings | 2026-11-05T16:42Z |
| Linux build | `pnpm install --frozen-lockfile && pnpm build && pnpm type-check` under WSL Node.js 24 | Pass; 57 static pages generated, type check exit 0 | 2026-11-05T16:58Z |
| Core Azure validation | `validate-deployment.ps1 -Scope sub -Location centralus -Template .\infra\main.bicep -Subscription ad72197d-5fd1-4d98-b110-1b7fc6a87997` | OVERALL: PASS; create-only preview, no modifications/deletions | 2026-11-05T16:48Z |
| Infrastructure lint | `az bicep lint --file .\infra\main.bicep` | Pass; latest API definitions unavailable locally, ARM validation passed | 2026-11-05T16:50Z |
| Policy review | `az policy assignment list` and `az policy set-definition show` for the target subscription | Three database-protection initiatives; no applicable web-hosting restriction; ARM validation passed | 2026-11-05T16:48Z |
| Static RBAC review | Review `infra/main.bicep` and `infra/web.bicep` | No managed identities, role grants, or credentials required | 2026-11-05T16:58Z |
| Authorization tests | `pnpm exec playwright test tests/message-center-access.spec.ts --project=chromium --reporter=line` with external base URL | 25 passed | 2026-11-05T16:56Z |
| Packaged server smoke check | HTTP requests to local standalone `/`, `/api/health`, `/api/messages` | Homepage 200; health 200 with Message Center disabled; messages 503 fail-closed | 2026-11-05T16:59Z |
| Health test | `pnpm exec playwright test tests/health.spec.ts --project=chromium --reporter=line` against standalone server | 1 passed | 2026-11-05T16:59Z |
| Final package extraction | Extract complete `application.tar.gz` on Linux local storage and request `/`, `/api/health`, `/api/messages` | Homepage and health 200; messages 503 fail-closed | 2026-11-05T17:19Z |
| Final startup configuration | `az deployment sub validate` and `az deployment sub what-if` with updated `infra/main.bicep` | Pass; changes confined to this deployment | 2026-11-05T17:19Z |
| Asset-fix regression reproduction | `PLAYWRIGHT_BASE_URL=<production> pnpm exec playwright test tests/public-assets.spec.ts --project=chromium --reporter=line` | Failed as expected: dashboard SVG returned 404 | 2026-11-05T18:05Z |
| Asset-fix package verification | Extract the existing compiled application, move nested `public/public` contents into `public`, preserve application symlinks, and run image/health Playwright specs against its Linux Node.js 24 server | 2 passed; all rendered dashboard image URLs return nonempty image responses; no application rebuild needed | 2026-11-05T18:09Z |
| Asset-fix lint | `pnpm lint --quiet` | Pass | 2026-11-05T18:07Z |
| Asset-fix Azure revalidation | `validate-deployment.ps1 -Scope sub -Location centralus -Template .\infra\main.bicep -Subscription ad72197d-5fd1-4d98-b110-1b7fc6a87997`, `az bicep lint`, policy assignment review | OVERALL: PASS; existing database-only policies unchanged; no infrastructure changes will be applied for this asset-only publish | 2026-11-05T18:09Z |

Asset-fix static RBAC verification: hosting remains identity-free, with no role
assignments or downstream Azure data access. This update changes only the
deployment archive's public asset layout.

## 8. Files to generate

| File | Purpose |
|------|---------|
| `infra/main.bicep` | Dedicated Linux App Service and plan |
| Deployment build configuration, if necessary | Reproducible Linux-native package |
| `README.md` update | Deployment and integration limitations |

## 9. Next steps

Deployment complete.

## 10. Deployment result

- Tenant: `9a35777a-28ce-467a-92be-0cf503f7e030`.
- Subscription: `ad72197d-5fd1-4d98-b110-1b7fc6a87997`.
- Resource group: `rg-pulse360`.
- App: `pulse360-v7hfgtr6eiajc`.
- Plan: `asp-pulse360-v7hfgtr6eiajc`, Linux Basic B1.
- URL: https://pulse360-v7hfgtr6eiajc.azurewebsites.net
- Completed: 2026-11-05T17:22Z.

The CLI publish command initially selected an unsuitable cross-tenant
publishing token. Deployment succeeded using a destination-tenant Entra bearer
token acquired with an explicit subscription. Basic publishing remains disabled.

The final ZIP contains a tar archive of the complete standalone application.
This preserves pnpm and Turbopack symlinks, including `.next/node_modules`;
flattening either tree during ZIP creation breaks runtime module resolution.
The host extracts the archive into local `/tmp/pulse360` before starting Node.js.
The final extracted artifact was verified before upload.

### Live verification

- Homepage: HTTP 200 with Pulse360 content.
- JavaScript asset: HTTP 200.
- `/api/health`: HTTP 200, application healthy, Message Center disabled.
- `/api/power-bi-news`: HTTP 200 with a populated public feed.
- `/api/messages`: HTTP 503 with the explicit unconfigured-access response.
- Production health Playwright test: 1 passed.
- Security headers: frame denial, HSTS, and MIME sniffing protection present.
- SCM basic publishing: `allow=false`.
- App identity: none; resource-group role assignment query returned no new grants.
- App settings contain only production runtime configuration and
  `MESSAGE_CENTER_PUBLIC=false`; no source database, Graph, APIM, or auth settings.

Message Center remains intentionally disabled. Enabling it requires separate
destination-tenant administrator setup, database provisioning, and scheduling.

### Public image repair

Completed 2026-11-05T18:14Z. The original archive contained
`public/public/images` and `public/public/icons`, so dashboard URLs returned
404 and optimized images returned 400. Moving those assets to `public/images`
and `public/icons` corrected the package without changing application code,
infrastructure, credentials, or tenant configuration.

Published corrected archive using destination-tenant Entra authentication;
Kudu deployment `682581a8-eb47-4290-bdea-08635e81176e` completed with status 4.
Explicitly restarted the app to extract the updated archive. Production
dashboard-image and health Playwright checks both passed. All four original PNGs,
their 256px/384px optimized variants, and rendered SVG icons return nonempty image
responses with HTTP 200. Message Center remains HTTP 503; resource-group role
assignments remain empty. Final `pnpm lint --quiet` passed.

README packaging instructions now copy directory contents rather than nest
existing directories, explicitly restart after publishing, and include the
dashboard-image regression check.
