import { expect, test } from '@playwright/test';

const lifecycleRow = {
  edition: '',
  release: '',
  supportPolicy: '',
  startDate: null,
  mainStreamEndDate: null,
  extendedEndDate: null,
  retirementDate: null,
  releaseStartDate: null,
  releaseEndDate: null,
  docsUrl: '',
  endOfSupportDate: null,
};

test('switches between Microsoft and Azure lifecycle views', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-22T12:00:00Z'));
  await page.route('**/api/mslifecycle', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        rows: [
          ...Array.from({ length: 60 }, (_, index) => ({
            ...lifecycleRow,
            product: `Windows Server ${index + 1}`,
            category: '',
          })),
          ...Array.from({ length: 60 }, (_, index) => ({
            ...lifecycleRow,
            product: `Azure Test Service ${index + 1}`,
            category: `Feature ${index + 1}`,
            releaseEndDate: '2026-10-31',
            docsUrl: `https://azure.microsoft.com/updates/${index + 1}`,
            endOfSupportDate: index === 0 ? '3 months' : 'Out of Support',
          })),
        ],
        sourceUrl: 'https://example.com/lifecycle.xlsx',
        cachedAt: '2026-07-22T12:00:00.000Z',
        fromCache: true,
      }),
    })
  );

  await page.goto('/ms-lifecycle');

  await expect(page.getByRole('heading', { name: 'Microsoft Support Lifecycle' })).toBeVisible();

  const microsoftTab = page.getByRole('tab', { name: 'Microsoft Product Lifecycle' });
  const azureTab = page.getByRole('tab', { name: 'Azure Lifecycle' });
  const tableScroll = page.getByTestId('lifecycle-table-scroll');

  await expect(microsoftTab).toHaveAttribute('aria-selected', 'true');
  await expect(
    page.getByText(/Microsoft product support and Azure feature retirement dates sourced from the/)
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Microsoft Lifecycle export' })).toHaveAttribute(
    'href',
    'https://learn.microsoft.com/en-us/lifecycle/products/export/'
  );
  await expect(page.getByRole('link', { name: 'Azure RSS source' })).not.toBeVisible();
  await expect(page.getByRole('cell', { name: 'Windows Server 1', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Azure Test Service 1', exact: true })
  ).not.toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Category', exact: true })).not.toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Azure Feature', exact: true })
  ).not.toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Status', exact: true })).not.toBeVisible();
  await expect(tableScroll).toHaveCSS('overflow-x', 'scroll');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollHeight))
    .toBeLessThanOrEqual(720);
  await expect
    .poll(() => tableScroll.evaluate(element => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await expect
    .poll(() => tableScroll.evaluate(element => element.scrollHeight > element.clientHeight))
    .toBe(true);

  await azureTab.click();

  await expect(azureTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Azure Lifecycle' })).toBeVisible();
  await expect(page.getByText(/Azure feature retirement dates sourced from the/)).toBeVisible();
  await expect(
    page.getByText(/Microsoft product support and Azure feature retirement dates sourced from the/)
  ).not.toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Microsoft Lifecycle export' }).first()
  ).toHaveAttribute('href', 'https://learn.microsoft.com/en-us/lifecycle/products/export/');
  await expect(page.getByRole('link', { name: 'Azure RSS source' })).not.toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Product Listing Name/ })).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Azure Feature', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Release End Date/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'DocsUrl', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /End of Support/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Edition', exact: true })).not.toBeVisible();
  await expect(page.getByRole('cell', { name: 'Azure Test Service 1', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Feature 1', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: '3 months · Oct 31, 2026', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Windows Server 1', exact: true })).not.toBeVisible();
  await expect(tableScroll).toHaveCSS('overflow-x', 'scroll');
  await expect
    .poll(() => tableScroll.evaluate(element => element.scrollWidth > element.clientWidth))
    .toBe(false);
  await expect
    .poll(() => tableScroll.evaluate(element => element.scrollHeight > element.clientHeight))
    .toBe(true);
});

test('shows the actual date with the end of support countdown', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-22T12:00:00Z'));
  await page.route('**/api/mslifecycle', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        rows: [
          {
            ...lifecycleRow,
            product: 'Azure Test Service',
            category: 'Retiring feature',
            releaseEndDate: '2026-10-12',
            endOfSupportDate: '5 months',
          },
        ],
        sourceUrl: 'https://example.com/lifecycle.xlsx',
        cachedAt: '2026-07-22T12:00:00.000Z',
        fromCache: true,
      }),
    })
  );

  await page.goto('/ms-lifecycle');
  await page.getByRole('tab', { name: 'Azure Lifecycle' }).click();

  await expect(
    page.getByRole('link', { name: 'Microsoft Lifecycle export' }).first()
  ).toHaveAttribute('href', 'https://learn.microsoft.com/en-us/lifecycle/products/export/');
  await expect(page.getByRole('link', { name: 'Azure RSS source' })).toHaveCount(0);
  await expect(
    page.getByRole('cell', { name: '3 months · Oct 12, 2026', exact: true })
  ).toBeVisible();
});

test('filters Microsoft products by lifecycle dates within future month windows', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-07-28T12:00:00'));
  await page.route('**/api/mslifecycle', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        rows: [
          {
            ...lifecycleRow,
            product: 'Past Product',
            mainStreamEndDate: '2026-07-27',
            category: '',
          },
          {
            ...lifecycleRow,
            product: 'Three Month Product',
            mainStreamEndDate: '2026-10-28',
            category: '',
          },
          {
            ...lifecycleRow,
            product: 'Six Month Product',
            extendedEndDate: '2026-12-15',
            category: '',
          },
          {
            ...lifecycleRow,
            product: 'Nine Month Product',
            retirementDate: '2027-03-15',
            category: '',
          },
          {
            ...lifecycleRow,
            product: 'Twelve Month Product',
            retirementDate: '2027-07-28',
            category: '',
          },
          {
            ...lifecycleRow,
            product: 'Beyond Window Product',
            retirementDate: '2027-08-01',
            category: '',
          },
        ],
        sourceUrl: 'https://example.com/lifecycle.xlsx',
        cachedAt: '2026-07-28T12:00:00.000Z',
        fromCache: true,
      }),
    })
  );

  await page.goto('/ms-lifecycle');

  const expirationFilter = page.getByRole('combobox', { name: 'Filter by expiration date' });
  await expect(expirationFilter.getByRole('option')).toHaveText([
    'All expiration dates',
    'Expiring within 3 months',
    'Expiring within 6 months',
    'Expiring within 9 months',
    'Expiring within 12 months',
  ]);

  await expirationFilter.selectOption('3');
  await expect(page.getByRole('cell', { name: 'Three Month Product', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Six Month Product', exact: true })
  ).not.toBeVisible();
  await expect(page.getByRole('cell', { name: 'Past Product', exact: true })).not.toBeVisible();

  await expirationFilter.selectOption('6');
  await expect(page.getByRole('cell', { name: 'Six Month Product', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Nine Month Product', exact: true })
  ).not.toBeVisible();

  await expirationFilter.selectOption('9');
  await expect(page.getByRole('cell', { name: 'Nine Month Product', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Twelve Month Product', exact: true })
  ).not.toBeVisible();

  await expirationFilter.selectOption('12');
  await expect(page.getByRole('cell', { name: 'Twelve Month Product', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'Beyond Window Product', exact: true })
  ).not.toBeVisible();
});

test('bounds rendered rows and exports the filtered lifecycle view', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-02T12:00:00Z'));
  await page.route('**/api/mslifecycle', route =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        rows: Array.from({ length: 125 }, (_, index) => ({
          ...lifecycleRow,
          product: `Product ${String(index + 1).padStart(3, '0')}`,
          category: '',
        })),
        sourceUrl: 'https://example.com/lifecycle.xlsx',
        cachedAt: '2026-08-02T12:00:00.000Z',
        fromCache: true,
      }),
    })
  );

  await page.goto('/ms-lifecycle');
  await expect(page.locator('tbody tr')).toHaveCount(100);
  await expect(page.getByRole('cell', { name: 'Product 125', exact: true })).not.toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('pulse360-lifecycle-2026-08-02.csv');

  await page.getByRole('button', { name: 'Load 25 more' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(125);
  await expect(page.getByRole('cell', { name: 'Product 125', exact: true })).toBeVisible();
});
