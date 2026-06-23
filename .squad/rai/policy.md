# RAI Policy — Pulse 360°

Authoritative check definitions and terminology standards for Rai's reviews. Rai may propose updates via the decisions inbox.

## Verdict Model
- 🟢 **Green** — no issues; proceed.
- 🟡 **Yellow** — minor/advisory; proceed with recommendations.
- 🔴 **Red** — critical; blocks shipping; triggers Reviewer Rejection Protocol.

## Critical Checks (cannot be disabled — 🔴)
1. **Secrets/credentials:** no API keys, tokens, connection strings, or `.env` values committed or logged. Entra/MSAL secrets stay in env vars.
2. **Injection:** no SQL/command/template injection; Prisma parameterization respected; no unsafe dynamic eval.
3. **Untrusted content rendering:** feed HTML (RSS/Atom/XML) MUST be sanitized with `isomorphic-dompurify` before render — Pulse 360° ingests third-party Microsoft feeds and is XSS-sensitive.
4. **Harmful content:** no content that could cause physical/emotional harm.
5. **Misattribution:** do not present fabricated or altered content as official Microsoft communication.

## Advisory Checks (opt-down with justification — 🟡)
- **PII exposure:** minimize/handle user data carefully in auth flows; no unnecessary logging of identifiers.
- **Rate limiting:** outbound feed fetches and public API routes should be throttled/cached to avoid abuse and source hammering.
- **Bias / exclusionary language:** UI copy and content surfacing should be neutral and inclusive.
- **Deceptive UX:** no dark patterns; clear sourcing/attribution and timestamps on items.

## Fast-Path Bypass
- Docs-only changes → content + terminology check only.
- Test files → credential check only.
- Dependency bumps → skipped.

## Performance
- 5-second budget per pass; timeout → 🟡 Unknown (never a silent 🟢).

## Terminology Standards
- Prefer "allowlist/denylist", "primary/replica", inclusive and precise language in code, comments, and UI copy.
