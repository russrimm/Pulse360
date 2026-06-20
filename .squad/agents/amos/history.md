# Amos — History

## Seed (2026-06-20)
- **Project:** Pulse 360° — Next.js 16 news portal. Live at https://www.mspulse360.app.
- **Requested by:** Russ Rimmerman (Russ).
- **My role:** Backend — API route handlers (`src/app/api/*`), auth (next-auth + MSAL/Entra), Prisma 7 + Postgres.
- **Stack notes:** Auth at `src/app/api/auth/[...nextauth]`; Prisma client generated to `src/generated/`; schema at `prisma/schema.prisma`. Secrets via env vars — never commit. I pair with Alex on feed route plumbing.

## Learnings
<!-- append-only -->

### 2026-06-20T15:31:22-05:00 — ESLint 9 flat-config fix: lint restored, 257 pre-existing errors surfaced
Diagnosed and repaired the `npm run lint` crash (TypeError: sourceCode.getAllComments is not a function) in ESLint 9 flat config:
- Root cause: ESLint 9 does not auto-ignore `.next/` by default, and `pluginReact.configs.flat.recommended` had no file restrictions. When react rules ran on `.next/app-path-routes-manifest.json` (JSON, not JS), the `@eslint/json` plugin's custom `SourceCode` implementation lacked `getAllComments()`, causing the crash.
- Fix: Added global `ignores` block for build artifacts + build directories, restricted react plugin to JS/TS files only, disabled react-in-jsx-scope/prop-types (React 19+TS), set globals to include both browser + Node (isomorphic Next.js).
- No npm changes; config-only fix to `eslint.config.mjs`.
- Outcome: `npm run lint` now runs to completion and surfaces 257 pre-existing errors (124 unused-vars, 61 no-explicit-any, 39 unescaped-entities, etc.). All 254 src/ + 3 config errors are out-of-scope for Amos. Russ to triage remediation strategy.
- See: `.squad/decisions.md` (decision merged 2026-06-20T15:31:22-05:00).

### 2026-06-20 — Upcoming: Error Envelope + Route Migration (from Alex/Rai feed deep-dive)
Alex's feed-consolidation roadmap assigns Amos the backend plumbing for two high-priority tracks:

1. **`ApiResponse<T>` error envelope** — Implement `ApiSuccess<T>` / `ApiError` discriminated union in a shared module; migrate all ~20 `/api/*` route handlers off their current 7+ incompatible error patterns. Key rule: no `200` with empty array when upstream is down (use `502`/`503`).

2. **Route migration scaffolding** — As Alex lands `NormalizedUpdate` parsers in `src/lib/feed/parsers/`, Amos wires the new parsers into route handlers and removes the inline parsing logic. Coordinate with Alex on migration sequencing (one source at a time).

3. **`sanitizeFeedHtml()` ingestion hook** — Rai issued a 🔴 CRITICAL verdict: 8 render sites are unsanitized. Amos implements `src/lib/feed/sanitize.ts` (isomorphic-dompurify) and applies it at ingestion points in `api.server.ts` and route handlers. Rai must sign off on the ALLOWED_TAGS config before merge. This is step 1 — blocks all other feed work.

See: `.squad/agents/alex/feed-consolidation-plan.md`, `.squad/decisions.md` (3 new Alex entries + 1 Rai entry).
