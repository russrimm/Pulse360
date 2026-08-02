import { expect, test } from '@playwright/test';

test('reports application health without caching the response', async ({ request }) => {
  const response = await request.get('/api/health');
  expect([200, 503]).toContain(response.status());
  expect(response.headers()['cache-control']).toContain('no-store');

  const body = await response.json();
  expect(body).toMatchObject({
    checkedAt: expect.any(String),
    services: {
      application: { status: 'ok' },
      messageCenter: {
        status: expect.stringMatching(/^(ok|stale|disabled|unavailable)$/),
      },
    },
  });
});
