/**
 * src/lib/feed/sanitize.ts
 *
 * Centralized feed-HTML sanitizer.
 * Used server-side at ingestion/render and by the client <SafeHtml> component
 * (defense-in-depth: both render paths share one source of truth).
 *
 * LOCKED product decisions — do NOT change without team review:
 *   1. STRIP all inline style: 'style' is absent from ALLOWED_ATTR and explicitly
 *      listed in FORBID_ATTR so no style attribute survives sanitization.
 *   2. Image proxy: every external http(s) img[src] is rewritten to route through
 *      /api/image-proxy?url=<encoded> to avoid mixed-content and third-party leaks.
 *      Already-proxied or same-origin relative srcs are left untouched.
 *   3. Trust MS endpoints: no provenance checks beyond protocol enforcement below.
 */

import DOMPurify from 'isomorphic-dompurify';

// ─── Shared configuration ────────────────────────────────────────────────────

/**
 * DOMPurify config object shared by sanitizeFeedHtml() and the <SafeHtml>
 * client component so both rendering paths stay in sync.
 */
export const SANITIZE_CONFIG = {
  // Sensible allow-list for typical Microsoft feed content.
  ALLOWED_TAGS: [
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

  // Decision 1: 'style' is intentionally absent here — see FORBID_ATTR below.
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt', 'title', 'width', 'height',
    'colspan', 'rowspan', 'align',
  ],

  // DOMPurify strips target by default; ADD_ATTR makes it survive the filter
  // so the afterSanitizeAttributes hook can then enforce target="_blank".
  ADD_ATTR: ['target'],

  // Decision 1: Explicitly forbid style (defense-in-depth on top of omission).
  // DOMPurify strips all on* handlers by default; the four below are listed
  // explicitly per spec as well.
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style', 'formaction'],

  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'],

  /**
   * Decision 3 (security): restrict URI attributes to https? and relative paths.
   *
   * The regex matches if the value:
   *   a) starts with "http://" or "https://", OR
   *   b) does NOT start with a protocol-like scheme ("[a-z][a-z0-9+-.]*:").
   *
   * This allows relative paths ("/", "./", "#") while blocking javascript:,
   * data:, vbscript:, blob:, ftp:, mailto:, etc.
   */
  ALLOWED_URI_REGEXP: /^(?:https?:\/\/|(?![a-z][a-z0-9+\-.]*:))/i,

  ALLOW_DATA_ATTR: false,
};

// ─── Hook registration (runs once at module load) ────────────────────────────
//
// DOMPurify.addHook() appends to a global hook list. Registering inside
// sanitizeFeedHtml() on every call would stack duplicate hooks (especially
// visible during Next.js hot-reload). The boolean guard ensures hooks are
// registered exactly once per process lifetime.

let _hooksRegistered = false;

function registerHooks(): void {
  if (_hooksRegistered) return;
  _hooksRegistered = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // ── Link hardening ────────────────────────────────────────────────────
    // Force every anchor to open in a new tab with opener isolation.
    if (node.tagName === 'A') {
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('target', '_blank');
    }

    // ── Decision 2: image proxy rewrite ──────────────────────────────────
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') ?? '';
      if (!src) return;

      // Already proxied — do not double-proxy.
      if (src.startsWith('/api/image-proxy')) return;

      if (/^https?:\/\//i.test(src)) {
        // External absolute URL → route through internal proxy.
        node.setAttribute('src', `/api/image-proxy?url=${encodeURIComponent(src)}`);
      } else if (/^[a-z][a-z0-9+\-.]*:/i.test(src)) {
        // Non-http(s) absolute URI (data:, blob:, etc.).
        // ALLOWED_URI_REGEXP should already have stripped these; remove defensively.
        node.removeAttribute('src');
      }
      // Relative paths (same-origin) fall through untouched.
    }
  });
}

// Register immediately at module load time.
registerHooks();

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Sanitize feed HTML using the shared config and hooks.
 *
 * Uses isomorphic-dompurify so this is safe to call server-side
 * (it initialises jsdom on the server automatically).
 */
export function sanitizeFeedHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * Strip ALL HTML tags for plain-text summaries and excerpts.
 * Collapses runs of whitespace and trims the result.
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).replace(/\s+/g, ' ').trim();
}
