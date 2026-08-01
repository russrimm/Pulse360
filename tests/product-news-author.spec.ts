import { expect, test } from '@playwright/test';

test('deduplicates author metadata and feed requests on initial load', async ({ page }) => {
  let authorMetadataRequests = 0;
  let authorFeedRequests = 0;

  await page.route('**/api/microsoft-news-authors', route => {
    authorMetadataRequests += 1;
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { name: 'Test Author', title: 'Cloud Architect', slug: 'test-author' },
      ]),
    });
  });
  await page.route('**/api/author-feed?slug=test-author', route => {
    authorFeedRequests += 1;
    return route.fulfill({
      contentType: 'application/rss+xml',
      body: `<?xml version="1.0"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Test post</title>
              <link>https://blogs.microsoft.com/test-post</link>
              <guid>test-post</guid>
              <pubDate>Fri, 31 Jul 2026 12:00:00 GMT</pubDate>
              <description>Test description</description>
            </item>
          </channel>
        </rss>`,
    });
  });

  await page.goto('/product-news/author/test-author');

  await expect(
    page.getByRole('heading', { name: 'Posts by Test Author - Cloud Architect' })
  ).toBeVisible();
  await expect(page.getByText('Test post', { exact: true })).toBeVisible();
  await expect.poll(() => authorMetadataRequests).toBe(1);
  await expect.poll(() => authorFeedRequests).toBe(1);
});
