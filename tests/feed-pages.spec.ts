/**
 * tests/feed-pages.spec.ts
 *
 * WI-05 – E2E sanity: Azure/M365/Release-Plan/Message-Center feed pages.
 * Requires a running dev server at http://localhost:3000.
 *
 * Tests are skipped automatically when the server is unreachable (acceptable
 * in CI environments without live credentials); the unit suite
 * (tests/sanitize.spec.ts) is the authoritative M0 gate.
 *
 * Run: npx playwright test tests/feed-pages.spec.ts
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// ────────────────────────────────────────────────────────────────────────────
// Server-availability guard
// ────────────────────────────────────────────────────────────────────────────

let serverAvailable = false;

async function probeServer(request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get(BASE_URL, { timeout: 8_000 });
    return res.status() < 500;
  } catch {
    return false;
  }
}

test.beforeAll(async ({ request }) => {
  serverAvailable = await probeServer(request);
  if (!serverAvailable) {
    console.warn(
      '[feed-pages] Dev server not reachable at http://localhost:3000 — ' +
      'all E2E tests will be skipped. Start `npm run dev` to run them.',
    );
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Helper: shared assertions for a feed-content page
// ────────────────────────────────────────────────────────────────────────────

/**
 * After navigating to a feed page we assert the XSS safety invariants.
 * We tolerate pages that redirect to /login or show an empty-state skeleton
 * (live MS data / auth may not be available) — but we still enforce that no
 * dangerous DOM artefacts were injected.
 */
async function assertFeedPageSafe(
  page: import('@playwright/test').Page,
  path: string,
): Promise<void> {
  const res = await page.goto(`${BASE_URL}${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // 1. Page must respond (not a hard 5xx crash).
  expect(res?.status(), `${path} should not return a 5xx`).toBeLessThan(500);

  // 2. No on* event handlers injected into content areas by feed HTML.
  //    (Next.js injects __NEXT_DATA__ inline scripts; we scope the check to
  //    the content area to avoid false positives from framework scripts.)
  const onHandlersInContent = await page.evaluate(() => {
    const content = document.querySelector(
      'main, [data-testid="feed-content"], article, .prose, .content',
    );
    if (!content) return 0;
    return content.querySelectorAll('[onerror],[onload],[onclick],[onmouseover]').length;
  });
  expect(
    onHandlersInContent,
    `${path}: no on* event handlers must survive in feed content`,
  ).toBe(0);

  // 3. No alert() dialogs opened automatically (XSS would trigger this).
  //    We listen for dialogs and fail if one fires.
  page.on('dialog', async (dialog) => {
    await dialog.dismiss();
    throw new Error(`${path}: unexpected dialog opened — possible XSS: "${dialog.message()}"`);
  });

  // 4. Links inside any content area must carry safety attributes.
  //    (Only check if feed content area is present AND non-empty.)
  const contentLinks = await page.evaluate(() => {
    const content = document.querySelector('main, article, .prose, .content');
    if (!content) return { total: 0, unsafe: 0 };
    const anchors = Array.from(content.querySelectorAll('a[href]'));
    // Only external links need target/rel — skip same-origin or hash links.
    const external = anchors.filter((a) => {
      const href = (a as HTMLAnchorElement).getAttribute('href') ?? '';
      return /^https?:\/\//i.test(href);
    });
    const unsafe = external.filter((a) => {
      const rel = (a as HTMLAnchorElement).getAttribute('rel') ?? '';
      const target = (a as HTMLAnchorElement).getAttribute('target') ?? '';
      return !rel.includes('noopener') || target !== '_blank';
    });
    return { total: external.length, unsafe: unsafe.length };
  });

  expect(
    contentLinks.unsafe,
    `${path}: all external links must have rel=noopener and target=_blank (found ${contentLinks.total} external links, ${contentLinks.unsafe} unsafe)`,
  ).toBe(0);
}

// ────────────────────────────────────────────────────────────────────────────
// Feed page tests
// ────────────────────────────────────────────────────────────────────────────

test.describe('Feed pages – XSS safety + fidelity (E2E)', () => {

  test('azure-updates listing page responds and is safe', async ({ page }) => {
    test.skip(!serverAvailable, 'Dev server not running at localhost:3000');
    await assertFeedPageSafe(page, '/azure-updates');
  });

  test('m365-updates listing page responds and is safe', async ({ page }) => {
    test.skip(!serverAvailable, 'Dev server not running at localhost:3000');
    await assertFeedPageSafe(page, '/m365-updates');
  });

  test('release-plans listing page responds and is safe', async ({ page }) => {
    test.skip(!serverAvailable, 'Dev server not running at localhost:3000');
    await assertFeedPageSafe(page, '/release-plans');
  });

  test('message-center listing page responds and is safe', async ({ page }) => {
    test.skip(!serverAvailable, 'Dev server not running at localhost:3000');
    await assertFeedPageSafe(page, '/message-center');
  });

});
