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
