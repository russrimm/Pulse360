/**
 * tests/msrc.spec.ts
 *
 * The MSRC CVRF document for a Patch Tuesday month is ~12 MB, which exceeds the
 * 4.5 MB serverless response limit and previously made /msrc fail to load any
 * data. These tests lock in the trimmed, paginated API contract and check that
 * the page renders vulnerabilities and lets you page through them.
 *
 * Run: npx playwright test tests/msrc.spec.ts
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

// Vercel rejects function responses larger than 4.5 MB.
const MAX_RESPONSE_BYTES = 4.5 * 1024 * 1024;
const MAX_PAGE_SIZE = 100;

let serverAvailable = false;

async function probeServer(request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get('/', { timeout: 8_000 });
    return res.status() < 500;
  } catch {
    return false;
  }
}

async function fetchRecentMonthIds(request: APIRequestContext, count: number): Promise<string[]> {
  const res = await request.get('/api/msrc', { timeout: 60_000 });
  expect(res.status(), '/api/msrc should return the update month list').toBe(200);

  const body = (await res.json()) as {
    value?: { ID?: string; InitialReleaseDate?: string }[];
  };
  const months = (body.value ?? []).filter(
    (month): month is { ID: string; InitialReleaseDate: string } =>
      typeof month.ID === 'string' && typeof month.InitialReleaseDate === 'string'
  );

  return months
    .toSorted(
      (a, b) => new Date(b.InitialReleaseDate).getTime() - new Date(a.InitialReleaseDate).getTime()
    )
    .slice(0, count)
    .map(month => month.ID);
}

test.beforeAll(async ({ request }) => {
  serverAvailable = await probeServer(request);
  if (!serverAvailable) {
    console.warn('[msrc] Configured test server is not reachable; MSRC tests will be skipped.');
  }
});

test.describe('MSRC security updates', () => {
  test('rejects a malformed monthId', async ({ request }) => {
    test.skip(!serverAvailable, 'Configured test server is unavailable');

    const res = await request.get('/api/msrc?monthId=../../etc/passwd', { timeout: 30_000 });
    expect(res.status()).toBe(400);
  });

  test('keeps every month page under the serverless response limit', async ({ request }) => {
    test.skip(!serverAvailable, 'Configured test server is unavailable');
    test.setTimeout(180_000);

    const monthIds = await fetchRecentMonthIds(request, 3);
    expect(monthIds.length, 'at least one update month should be available').toBeGreaterThan(0);

    for (const monthId of monthIds) {
      const res = await request.get(`/api/msrc?monthId=${monthId}&page=1`, { timeout: 90_000 });
      expect(res.status(), `${monthId} page 1 should succeed`).toBe(200);

      const bytes = (await res.body()).byteLength;
      expect(bytes, `${monthId} page 1 must stay under the 4.5 MB limit`).toBeLessThan(
        MAX_RESPONSE_BYTES
      );

      const body = (await res.json()) as {
        Vulnerability?: unknown[];
        page?: number;
        pageSize?: number;
        totalPages?: number;
        totalVulnerabilities?: number;
      };
      expect(body.page).toBe(1);
      expect(body.pageSize).toBeLessThanOrEqual(MAX_PAGE_SIZE);
      expect(body.totalPages ?? 0).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(body.Vulnerability)).toBe(true);
      expect((body.Vulnerability ?? []).length).toBeLessThanOrEqual(body.pageSize ?? MAX_PAGE_SIZE);
    }
  });

  test('serves distinct vulnerabilities per page and clamps out-of-range pages', async ({
    request,
  }) => {
    test.skip(!serverAvailable, 'Configured test server is unavailable');
    test.setTimeout(180_000);

    // The newest month can be a small out-of-band release, so look for one that actually pages.
    let monthId: string | undefined;
    let first: { Vulnerability?: { ID?: string }[]; totalPages?: number } | undefined;

    for (const candidate of await fetchRecentMonthIds(request, 4)) {
      const res = await request.get(`/api/msrc?monthId=${candidate}&page=1`, { timeout: 90_000 });
      const body = (await res.json()) as { Vulnerability?: { ID?: string }[]; totalPages?: number };
      if ((body.totalPages ?? 1) >= 2) {
        monthId = candidate;
        first = body;
        break;
      }
    }

    test.skip(!monthId || !first, 'No multi-page update month available');

    const secondRes = await request.get(`/api/msrc?monthId=${monthId}&page=2`, { timeout: 90_000 });
    const second = (await secondRes.json()) as { Vulnerability?: { ID?: string }[]; page?: number };
    expect(second.page).toBe(2);

    const firstIds = new Set((first?.Vulnerability ?? []).map(v => v.ID));
    const overlap = (second.Vulnerability ?? []).filter(v => firstIds.has(v.ID));
    expect(overlap, 'pages must not repeat vulnerabilities').toHaveLength(0);

    const clampedRes = await request.get(`/api/msrc?monthId=${monthId}&page=99999`, {
      timeout: 90_000,
    });
    const clamped = (await clampedRes.json()) as { page?: number; totalPages?: number };
    expect(clamped.page).toBe(clamped.totalPages);
  });

  test('renders vulnerabilities and pagination on /msrc', async ({ page }) => {
    test.skip(!serverAvailable, 'Configured test server is unavailable');
    test.setTimeout(180_000);

    // Pick a Patch Tuesday month so the page has to survive the largest CVRF document.
    const monthId = await test.step('resolve a busy month', async () => {
      const res = await page.request.get('/api/msrc', { timeout: 60_000 });
      const body = (await res.json()) as { value?: { ID?: string; InitialReleaseDate?: string }[] };
      const months = (body.value ?? []).filter(
        (month): month is { ID: string; InitialReleaseDate: string } =>
          typeof month.ID === 'string' && typeof month.InitialReleaseDate === 'string'
      );
      for (const month of months.toSorted(
        (a, b) =>
          new Date(b.InitialReleaseDate).getTime() - new Date(a.InitialReleaseDate).getTime()
      )) {
        const monthRes = await page.request.get(`/api/msrc?monthId=${month.ID}&page=1`, {
          timeout: 90_000,
        });
        const monthBody = (await monthRes.json()) as { totalPages?: number };
        if ((monthBody.totalPages ?? 1) >= 2) return month.ID;
      }
      return undefined;
    });

    test.skip(!monthId, 'No multi-page update month available');

    const res = await page.goto(`/msrc?month=${monthId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    expect(res?.status()).toBeLessThan(500);

    const updates = page.locator('section[aria-labelledby="security-updates-heading"]');
    await expect(updates.getByRole('heading', { level: 1 })).toContainText(
      'Microsoft Security Response Center'
    );

    // At least one CVE card must render, and the page must not show its error banner.
    await expect(updates.locator('table').first()).toBeVisible({ timeout: 90_000 });
    await expect(updates.getByRole('alert')).toHaveCount(0);

    const firstPageContent = await updates.locator('table').first().textContent();
    await updates.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/page=2/, { timeout: 60_000 });
    await expect
      .poll(async () => updates.locator('table').first().textContent(), { timeout: 90_000 })
      .not.toBe(firstPageContent);
    await expect(updates.getByRole('alert')).toHaveCount(0);
  });
});
