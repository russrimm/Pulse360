# Session Log — 2026-06-20T12-09-20: Feed Decisions & Backlog

## Summary

Russ resolved three critical deferral points from Rai's security mandate (plan §5d), establishing the final XSS sanitization policy boundaries. Scribe recorded all decisions in the canonical ledger. Miller decomposed the feed-consolidation roadmap into a sequenced 5-milestone / 20-work-item backlog with the XSS sanitization hotfix (M0) as the first shippable unit.

## Decisions Recorded (3)

1. **Sanitizer — strip ALL inline style (no style attr in allowlist)**  
   Inline style is a CSS-injection / XSS-adjacent vector; tight allowlist wins over styling fidelity on a public site (mspulse360.app).

2. **External feed <img> — proxy via internal Next.js image route**  
   All feed images routed through /api/image-proxy (server-controlled). Preserves content fidelity while eliminating tracking-pixel beacons and SVG-borne XSS.

3. **Endpoint trust — implicit trust in official Microsoft endpoints is acceptable**  
   No endpoint-provenance verification work required; server-side sanitization is the agreed control boundary.

## Backlog Structure (Miller)

- **M0** (Sanitization Hotfix, 5 WIs): Ships independently; Bobbie regression gate before M1.
  - WI-01: Alex — sanitizeFeedHtml() config + DOMPurify setup
  - WI-02: Amos — /api/image-proxy route
  - WI-03: Alex — <SafeHtml> client wrapper
  - WI-04: Alex — Apply to 8 unsanitized render sites
  - WI-05: Bobbie — Regression test suite + sign-off

- **M1** (Feed Foundation, 5 WIs): After M0 ships.
  - WI-06: Alex — Scaffold src/lib/feed/ module structure + NormalizedUpdate interface
  - WI-07: Alex — parsers/rss.ts (parallel with WI-08/09)
  - WI-08: Naomi — parsers/json-api.ts (parallel with WI-07/09)
  - WI-09: Amos — parsers/html-table.ts (parallel with WI-07/08)
  - WI-10: Alex — Route migration (depends on WI-07 + WI-09)

- **M2** (Normalization & Routing, 4 WIs):
  - WI-11: Alex — Migrate RSS proxy routes → new parsers
  - WI-12: Naomi — Migrate Azure/M365 JSON routes (depends on WI-07 + WI-08)
  - WI-13: Naomi — Migrate Fabric Roadmap routes (depends on WI-07 + WI-08)
  - WI-14: Amos — Standardized ApiResponse<T> error envelope (depends on WI-10)

- **M3** (Cache & Hygiene, 3 WIs):
  - WI-15: Alex — Cache revalidate tuning w/ comments (M365, Fabric)
  - WI-16: Alex — Cache headers standardization across routes
  - WI-17: Naomi — Remove deprecated direct-parse routes

- **M4** (Component Migration, 3 WIs):
  - WI-18: Naomi — Migrate component prop contracts to NormalizedUpdate
  - WI-19: Naomi — Remove old output types (Message, AzureUpdate, M365Update, ProductNews)
  - WI-20: Alex — Final validation + metrics

**Total:** 20 work items, 5 milestones, 4 owners (Alex/Amos/Naomi/Bobbie).

## Inbox Merged

- miller-feed-backlog.md — 11 sequencing decisions (WI gates, parallel work, envelope semantics)
- 
aomi-tailwind-typography-dedup.md — Typography rule consolidation (1 decision)

All entries now in canonical decisions.md; inbox cleared.

## Next Steps

- M0 begins pending Russ greenlight
- Bobbie prepares regression test matrix for M0 sign-off
- Alex/Amos ready parallel WI-01/WI-02 PRs (both within M0 scope)
