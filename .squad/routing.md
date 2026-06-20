# Routing — Pulse 360°

Routing maps work to the right specialist. The Coordinator picks the best match; when in doubt, pick one and go.

## By Domain

| Signal / Domain | Route to |
|-----------------|----------|
| Architecture, scope, decisions, code review, cross-cutting design | 🏗️ Miller (Lead) |
| React components, UI, pages, Tailwind/Radix styling, dark mode, client interactivity, Zustand/TanStack Query state | ⚛️ Naomi (Frontend) |
| API route handlers (`src/app/api/*`), server components, auth (next-auth/MSAL/Entra), Prisma schema & queries, Postgres, server-side logic | 🔧 Amos (Backend) |
| Feed ingestion (RSS/Atom/XML), feed parsing & normalization, data source integrations, MSRC/M365/Azure/Fabric/Power Platform feeds, caching, DOMPurify sanitization | 🗄️ Alex (Data/Integrations) |
| Playwright tests, test cases, edge cases, quality gates, regression coverage | 🧪 Bobbie (Tester) |
| RAI / content safety / responsible-AI review | 🛡️ Rai |
| Session memory, decisions merge, logs | 📋 Scribe |
| Backlog / keep-working / work queue | 🔄 Ralph |

## Notes

- **Feeds vs. APIs:** If the work is about *fetching/parsing/normalizing* a Microsoft feed, route to Alex. If it's about the *route handler plumbing, auth, or DB persistence* around it, route to Amos. They often pair.
- **UI vs. data:** Naomi owns what the user sees; Amos/Alex own how it gets there. Multi-domain features (e.g., "add a new news source page") fan out to Alex (feed) → Amos (API route) → Naomi (page/UI) → Bobbie (tests).
- **Reviewer:** Miller reviews architecture and significant code changes. Rai reviews for RAI/content-safety concerns before user-facing changes ship.
- **Default reviewer gate:** Significant features get a Miller review; user-facing/content changes get a Rai pass.
