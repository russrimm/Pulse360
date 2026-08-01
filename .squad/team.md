# Pulse 360° — Squad Team

## Project Context

- **Project:** Pulse 360° (`mcviewer`) — a product-agnostic Microsoft news & update portal.
- **What it does:** Unifies Microsoft's official update streams (Microsoft 365, Azure, Fabric, Power Platform, Dynamics 365, Copilot, MSRC) into a single fast, filterable, dark-mode-first dashboard. Live at https://www.mspulse360.app
- **Tech stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4, Radix UI, Headless UI, Prisma 7 + Postgres, Zustand, TanStack Query, next-auth + MSAL (Microsoft Entra), Playwright. Deployed on Vercel.
- **Data layer:** RSS/Atom + XML feed ingestion (`fast-xml-parser`, `rss-parser`, `xml2js`), sanitized via `isomorphic-dompurify`. Many `src/app/api/*` route handlers proxy and normalize Microsoft feeds.
- **Requested by / Product owner:** Russ Rimmerman (Russ)
- **Repo:** russrimm/Pulse360
- **Created:** 2026-06-20

## Members

| Name | Role | Charter | Badge |
|------|------|---------|-------|
| Miller | Lead | .squad/agents/miller/charter.md | 🏗️ Lead |
| Naomi | Frontend Dev | .squad/agents/naomi/charter.md | ⚛️ Frontend |
| Amos | Backend Dev | .squad/agents/amos/charter.md | 🔧 Backend |
| Alex | Data / Integrations | .squad/agents/alex/charter.md | 🗄️ Data |
| Bobbie | Tester | .squad/agents/bobbie/charter.md | 🧪 Tester |
| Scribe | Memory & Logs (silent) | .squad/agents/scribe/charter.md | 📋 Scribe |
| Ralph | Work Monitor | .squad/agents/ralph/charter.md | 🔄 Monitor |
| Rai | RAI Reviewer | .squad/agents/rai/charter.md | 🛡️ RAI |
| Russ | Product Owner (human) | — | 👤 Human |

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run type-check` — `tsc --noEmit`
- `npm run format` — Prettier
- Playwright tests live in `tests/` (see `playwright.config.ts`)
