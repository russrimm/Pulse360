# Naomi — History

## Seed (2026-06-20)
- **Project:** Pulse 360° — Next.js 16 App Router news portal (Microsoft update streams), dark-mode-first. Live at https://www.mspulse360.app.
- **Requested by:** Russ Rimmerman (Russ).
- **My role:** Frontend — React 19 components, App Router pages, Tailwind 4 + Radix + Headless UI, Zustand/TanStack Query, theming.
- **Stack notes:** Server Components are the default; opt into `"use client"` only for interactivity. Sanitize rendered feed HTML (DOMPurify is in the stack).

## Learnings
<!-- append-only -->

### 2026-06-20 — Upcoming: Fix 8 Unsanitized `dangerouslySetInnerHTML` Render Sites (🔴 Critical — Rai)
Rai's content-safety audit issued a **🔴 CRITICAL** verdict. Naomi owns the frontend fix:

**Sites to fix:**
- `AzureUpdateCard.tsx`
- `src/app/azure-update/[id]/page.tsx`
- `M365UpdateCard.tsx`
- `src/app/m365-update/[id]/page.tsx`
- `src/app/m365-update/rss/[id]/page.tsx`
- `ReleasePlanCard.tsx`
- `ReleasePlanDetail.tsx`
- `MessageDetail.tsx` (must sanitize AFTER its regex h2-transform)

**Pattern:** Replace raw `dangerouslySetInnerHTML={{ __html: content }}` with a `<SafeHtml>` client component (to be built — wraps DOMPurify as defense-in-depth). Primary sanitization happens server-side at ingestion (`sanitizeFeedHtml()` — Amos's work); `<SafeHtml>` is a second layer.

**Dependency:** Amos must land `sanitizeFeedHtml()` first; Rai must sign off on ALLOWED_TAGS, image policy, and link policy before merge. Do not ship the render-site fixes with only client-side sanitization — the server-side fix must also be in place.

3 residual-risk decisions still need Russ's input: inline `style` allowlist, `<img>` CSP/proxy policy, feed trust model.

See: `.squad/rai/audit-trail.md`, `.squad/decisions.md` (Rai 🔴 entry), `.squad/agents/alex/feed-consolidation-plan.md`.
