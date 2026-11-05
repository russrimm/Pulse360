import { expect, test } from '@playwright/test';

test('serves every local image rendered on the dashboard', async ({ request }) => {
  const dashboard = await request.get('/home');
  expect(dashboard.status()).toBe(200);

  const html = await dashboard.text();
  const imageUrls = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match =>
    match[1].replaceAll('&amp;', '&')
  );
  expect(imageUrls.length).toBeGreaterThanOrEqual(8);

  for (const url of new Set(imageUrls)) {
    expect(url).toMatch(/^\//);
    const image = await request.get(url);
    expect(image.status(), `Image failed to load: ${url}`).toBe(200);
    expect(image.headers()['content-type'], `Not an image: ${url}`).toMatch(/^image\//);
    expect((await image.body()).length, `Empty image: ${url}`).toBeGreaterThan(0);
  }
});
