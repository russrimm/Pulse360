# Alex — History

## Seed (2026-06-20)
- **Project:** Pulse 360° — Next.js 16 news portal unifying Microsoft feeds. Live at https://www.mspulse360.app.
- **Requested by:** Russ Rimmerman (Russ).
- **My role:** Data / Integrations — RSS/Atom/XML feed ingestion, parsing, normalization for M365, Azure, Fabric, Power Platform, D365, Copilot, MSRC.
- **Stack notes:** Parsers — `fast-xml-parser`, `rss-parser`, `xml2js`, `node-fetch`. Sanitize with `isomorphic-dompurify`. Sources live under `src/app/api/*-news`, `src/app/api/msrc`, `src/app/api/security-updates`, `src/app/api/proxy-rss`. Sample data: `msfeed.xml`, `release_plans_sample.json`. I pair with Amos on route plumbing/persistence.

## Learnings
<!-- append-only -->
