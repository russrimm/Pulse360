/**
 * tests/sanitize.spec.ts
 *
 * WI-05 – XSS regression gate (Playwright runner, no browser required).
 * Imports sanitizeFeedHtml / stripHtml directly and asserts every required
 * attack vector is neutralized.
 *
 * Run: npx playwright test tests/sanitize.spec.ts
 */
import { test, expect } from '@playwright/test';

// Relative import – @/ alias is not guaranteed to resolve in the Playwright
// Node runner, so we use a concrete relative path instead.
import { sanitizeFeedHtml, stripHtml } from '../src/lib/feed/sanitize';

// ────────────────────────────────────────────────────────────────────────────
// XSS attack vectors
// ────────────────────────────────────────────────────────────────────────────

test.describe('sanitizeFeedHtml – XSS regression vectors', () => {

  test('vector 01 – blocks <script> injection', () => {
    const out = sanitizeFeedHtml('<script>alert(1)</script>');
    expect(out).not.toContain('<script');
  });

  test('vector 02 – strips onerror event handler on <img>', () => {
    const out = sanitizeFeedHtml(
      '<img onerror="alert(1)" src="https://learn.microsoft.com/x.png">',
    );
    expect(out).not.toContain('onerror');
  });

  test('vector 03 – removes javascript: href', () => {
    const out = sanitizeFeedHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
  });

  test('vector 04 – removes data: href', () => {
    const out = sanitizeFeedHtml(
      '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    );
    expect(out).not.toContain('data:text/html');
  });

  test('vector 05 – strips style attribute but preserves text content', () => {
    const out = sanitizeFeedHtml('<p style="color:red;background:url(x)">text</p>');
    expect(out).not.toContain('style=');
    expect(out).toContain('text');
  });

  test('vector 06 – blocks <iframe>', () => {
    const out = sanitizeFeedHtml('<iframe src="https://evil.com"></iframe>');
    expect(out).not.toContain('<iframe');
  });

  test('vector 07 – rewrites external img src through /api/image-proxy', () => {
    const originalSrc = 'https://external.cdn.example.com/img.png';
    const out = sanitizeFeedHtml(`<img src="${originalSrc}">`);
    expect(out).toContain('/api/image-proxy?url=');
    expect(out).toContain(encodeURIComponent(originalSrc));
    // Must NOT contain the bare original http URL as a src value.
    expect(out).not.toContain(`src="${originalSrc}"`);
  });

  test('vector 08 – hardens <a> with rel="noopener noreferrer" and target="_blank"', () => {
    const out = sanitizeFeedHtml('<a href="https://learn.microsoft.com">link</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

});

// ────────────────────────────────────────────────────────────────────────────
// Visual-fidelity sanity check
// ────────────────────────────────────────────────────────────────────────────

test.describe('sanitizeFeedHtml – visual-fidelity / structure preservation', () => {

  test('representative MS-feed snippet: all structural tags and link text survive', () => {
    const snippet = [
      '<h2>Release highlights</h2>',
      '<p>Microsoft 365 <strong>monthly update</strong> is here.</p>',
      '<ul>',
      '  <li>Feature A improvements</li>',
      '  <li>Feature B enhancements</li>',
      '</ul>',
      '<a href="https://learn.microsoft.com/en-us/release">Read more</a>',
    ].join('\n');

    const out = sanitizeFeedHtml(snippet);

    // Structural tags must survive
    expect(out).toContain('<h2>');
    expect(out).toContain('<p>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>');
    expect(out).toContain('<strong>');
    expect(out).toContain('<a ');

    // Link text and href must survive
    expect(out).toContain('Read more');
    expect(out).toContain('href="https://learn.microsoft.com/en-us/release"');

    // Link must be hardened
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

});

// ────────────────────────────────────────────────────────────────────────────
// stripHtml
// ────────────────────────────────────────────────────────────────────────────

test.describe('stripHtml', () => {

  test('removes all HTML tags leaving plain text', () => {
    const input = '<h1>Title</h1><p>Some <strong>bold</strong> and <em>italic</em> text.</p>';
    const out = stripHtml(input);

    // No remaining tags
    expect(out).not.toMatch(/<[^>]+>/);

    // Text content preserved
    expect(out).toContain('Title');
    expect(out).toContain('bold');
    expect(out).toContain('italic');
    expect(out).toContain('text.');
  });

  test('collapses whitespace', () => {
    const out = stripHtml('<p>hello</p>   <p>world</p>');
    // Should not have multiple consecutive spaces
    expect(out).not.toMatch(/\s{2,}/);
  });

});
