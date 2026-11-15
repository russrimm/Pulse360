/**
 * tests/service-health-page.spec.ts
 *
 * E2E checks for /service-health. Graph is called server-side and cannot be
 * intercepted with page.route, so these assert the invariants that hold for
 * whichever state the configured test server is in (not configured, access
 * denied, unavailable, or ready) - above all, that states never contradict
 * each other. Data-level behavior is covered in tests/service-health.spec.ts.
 *
 * Run: pnpm exec playwright test tests/service-health-page.spec.ts --project=chromium
 */
import { test, expect, type APIRequestContext } from '@playwright/test';

let serverAvailable = false;

test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
  try {
    serverAvailable = (await request.get('/', { timeout: 8_000 })).status() < 500;
  } catch {
    serverAvailable = false;
  }
});

test.beforeEach(() => {
  test.skip(!serverAvailable, 'Configured test server is not reachable.');
});

const ERROR_STATES = ['not-configured', 'forbidden', 'throttled', 'quota', 'unavailable'];

test('lists Service Health in the main navigation', async ({ page }) => {
  await page.goto('/home');
  const link = page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Service Health' });
  await expect(link).toHaveAttribute('href', '/service-health');
});

test('renders exactly one coherent state', async ({ page }) => {
  const response = await page.goto('/service-health');
  expect(response?.status()).toBeLessThan(500);

  // Anonymous callers may be redirected to sign-in when auth is configured.
  if (!new URL(page.url()).pathname.startsWith('/service-health')) return;

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const errorState = page.locator('[data-service-health-state]');
  const hasOverview = (await page.locator('[data-service-health-section="overview"]').count()) > 0;

  if (hasOverview) {
    await expect(errorState).toHaveCount(0);
    await expect(page.locator('[data-service-health-headline]')).toHaveCount(1);
    // "No incidents" and "unavailable" must never appear together.
    const empty = await page.locator('[data-service-health-section-state="events-empty"]').count();
    const unavailable = await page.locator('[data-service-health-section-state="events-unavailable"]').count();
    expect(empty + unavailable).toBeLessThanOrEqual(1);
  } else {
    await expect(errorState).toHaveCount(1);
    expect(ERROR_STATES).toContain(await errorState.getAttribute('data-service-health-state'));
    // An error state must not also show status, filters, or lists.
    await expect(page.locator('[data-service-health-headline]')).toHaveCount(0);
    await expect(page.locator('[data-service-health-section="issues"]')).toHaveCount(0);
    await expect(page.getByLabel('Search issues')).toHaveCount(0);
  }
});

test('a malformed issue ID renders the not-found page', async ({ page }) => {
  await page.goto('/service-health/not%20a%20valid%20id');
  // Streaming from loading.tsx commits a 200 before notFound() runs, so assert on content.
  await expect(page.getByRole('heading', { name: 'This update could not be found' })).toBeVisible();
  await expect(page.locator('[data-service-health-issue]')).toHaveCount(0);
});

test('the JSON endpoint is gated and never leaks upstream details', async ({ request }) => {
  const response = await request.get('/api/service-health/m365', { maxRedirects: 0 });
  expect([200, 401, 403, 429, 502, 503]).toContain(response.status());
  const body = await response.text();
  expect(body).not.toMatch(/client_secret|Bearer\s/i);
});
