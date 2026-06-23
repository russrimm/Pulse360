/**
 * src/lib/feed/sanitize.ts
 *
 * Centralized feed-HTML sanitizer.
 * Used server-side at ingestion/render and by the client <SafeHtml> component
 * (defense-in-depth: both render paths share one source of truth).
 *
 * LOCKED product decisions — do NOT change without team review:
 *   1. STRIP all inline style: 'style' is absent from allowedAttributes and
 *      disallowed explicitly so no style attribute survives sanitization.
 *   2. Image proxy: every external http(s) img[src] is rewritten to route through
 *      /api/image-proxy?url=<encoded> to avoid mixed-content and third-party leaks.
 *      Already-proxied or same-origin relative srcs are left untouched.
 *   3. Trust MS endpoints: no provenance checks beyond protocol enforcement below.
 */

import sanitizeHtml from 'sanitize-html';

// ─── Shared configuration ────────────────────────────────────────────────────

/**
 * sanitize-html config object shared by sanitizeFeedHtml() and the <SafeHtml>
 * client component so both rendering paths stay in sync.
 */
export const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  // Sensible allow-list for typical Microsoft feed content.
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's',
    'a',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'span', 'div',
    'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'sup', 'sub',
  ],

  // Decision 1: 'style' is intentionally absent here.
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'td': ['colspan', 'rowspan', 'align'],
    'th': ['colspan', 'rowspan', 'align'],
  },

  // Decision 3 (security): restrict URI schemes to https/http and relative paths.
  // This blocks javascript:, data:, vbscript:, blob:, ftp:, mailto:, etc.
  allowedSchemes: ['https', 'http'],
  allowedSchemesByTag: {
    'a': ['https', 'http'],
    'img': ['https', 'http'],
  },

  // Decision 2: image proxy rewrite + link hardening via transformTags.
  transformTags: {
    // ── Link hardening ────────────────────────────────────────────────────
    // Force every anchor to open in a new tab with opener isolation.
    'a': (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),

    // ── Decision 2: image proxy rewrite ──────────────────────────────────
    'img': (tagName, attribs) => {
      const src = attribs.src ?? '';
      if (!src) return { tagName, attribs };

      // Already proxied — do not double-proxy.
      if (src.startsWith('/api/image-proxy')) return { tagName, attribs };

      if (/^https?:\/\//i.test(src)) {
        // External absolute URL → route through internal proxy.
        return {
          tagName,
          attribs: { ...attribs, src: `/api/image-proxy?url=${encodeURIComponent(src)}` },
        };
      }

      // Non-http(s) absolute URI (data:, blob:, etc.) — remove defensively.
      if (/^[a-z][a-z0-9+\-.]*:/i.test(src)) {
        const { src: _dropped, ...rest } = attribs;
        return { tagName, attribs: rest };
      }

      // Relative paths (same-origin) fall through untouched.
      return { tagName, attribs };
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sanitize feed HTML using the shared config.
 *
 * Uses sanitize-html which is a pure Node.js sanitizer with no DOM dependency,
 * safe to call on both server and client.
 */
export function sanitizeFeedHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_CONFIG);
}

/**
 * Strip ALL HTML tags for plain-text summaries and excerpts.
 * Collapses runs of whitespace and trims the result.
 */
export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [] }).replace(/\s+/g, ' ').trim();
}
