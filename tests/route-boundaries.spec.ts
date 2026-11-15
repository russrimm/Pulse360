import { expect, test } from '@playwright/test';

test('renders a branded not-found page with a recovery link', async ({ page }) => {
  const response = await page.goto('/definitely-missing-route');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This update could not be found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Pulse 360' })).toHaveAttribute(
    'href',
    '/home'
  );
});

test.describe('legacy Dynamics 365 / Power Platform release plan routes', () => {
  for (const source of [
    '/release-plans/dynamics-power',
    '/powerplatd365/release-plans',
    '/release-plans/roadmap',
  ]) {
    test(`${source} permanently redirects to the AI at Work roadmap`, async ({ request }) => {
      const response = await request.get(source, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      const location = new URL(response.headers().location, 'http://localhost');
      expect(location.pathname).toBe('/release-plans/m365');
      expect(location.searchParams.getAll('family')).toEqual([
        'Dynamics 365',
        'Power Platform and Dataverse',
      ]);
    });
  }

  test('legacy release plan detail URLs redirect to the AI at Work roadmap', async ({ request }) => {
    const response = await request.get('/release-plan/some-old-guid', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain('/release-plans/m365');
  });
});
