#!/usr/bin/env node
/**
 * Captures the Pulse 360° documentation screenshots in light and dark mode.
 *
 * Usage:
 *   pnpm build && pnpm start --hostname 127.0.0.1 --port 43128
 *   pnpm screenshots                       # capture everything
 *   pnpm screenshots home msrc             # capture only the named targets
 *
 * Override the target with SCREENSHOT_BASE_URL (defaults to http://127.0.0.1:43128).
 * Images are written to public/screenshots so both the README and the in-app
 * About page can reference a single copy.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:43128').replace(/\/$/, '');
const outputDir = path.join(process.cwd(), 'public', 'screenshots');
const viewport = { width: 1280, height: 800 };
const themes = ['dark', 'light'];

/**
 * `path` is captured directly. When `linkSelector` is set the script opens
 * `path`, follows the first matching link, and captures the destination — used
 * for detail pages whose IDs change every day.
 *
 * `requiredText` must be visible before the capture, so an empty or degraded
 * render never lands in the docs. `optional: true` downgrades a failure to a
 * warning, leaving the previously committed image untouched — used for pages
 * that need tenant credentials the capture host may not have.
 */
const targets = [
  { name: 'home', path: '/home', requiredText: 'Microsoft updates, one view' },
  { name: 'message-center', path: '/message-center', requiredText: 'Filters', optional: true },
  { name: 'release-plans', path: '/release-plans', requiredText: 'Power Platform' },
  { name: 'release-plans-m365', path: '/release-plans/m365', requiredText: 'Showing' },
  { name: 'release-plans-azure', path: '/release-plans/azure', requiredText: 'Showing' },
  { name: 'release-plans-fabric', path: '/release-plans/fabric', requiredText: 'Updates' },
  {
    name: 'release-plans-dynamics-power',
    path: '/release-plans/dynamics-power',
    requiredText: 'updates',
  },
  { name: 'release-plans-roadmap', path: '/release-plans/roadmap', requiredText: 'updates' },
  { name: 'fabric-roadmap', path: '/fabric-roadmap', requiredText: 'Updates' },
  { name: 'product-news', path: '/product-news', requiredText: 'Read more' },
  { name: 'msrc', path: '/msrc', requiredText: 'CVE-' },
  { name: 'security', path: '/security', requiredText: 'MSRC Portal' },
  { name: 'ms-lifecycle', path: '/ms-lifecycle', requiredText: 'items matching' },
  { name: 'about', path: '/about', requiredText: 'Welcome to Pulse 360' },
  {
    name: 'm365-update-detail',
    path: '/release-plans/m365',
    requiredText: 'Showing',
    linkSelector: 'a[href^="/m365-update/"]',
  },
];

const requested = process.argv.slice(2);
const selected = requested.length
  ? targets.filter((target) => requested.includes(target.name))
  : targets;

if (!selected.length) {
  console.error(`No matching targets. Known targets:\n  ${targets.map((t) => t.name).join('\n  ')}`);
  process.exit(1);
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  // Let font swap, image decoding, and entry transitions finish.
  await page.waitForTimeout(1_500);
}

/** Never publish a screenshot of an error boundary or an empty results list. */
async function assertRendered(page, target) {
  const errorState = page.getByText(/This page could not be loaded|Something went wrong/i);
  if (await errorState.count()) {
    throw new Error('page rendered its error state (missing credentials or upstream failure)');
  }

  if (target.requiredText) {
    await page
      .getByText(target.requiredText, { exact: false })
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }
}

async function capture(context, target, theme) {
  const page = await context.newPage();
  const fileName = `${target.name}-${theme}.png`;

  try {
    const response = await page.goto(`${baseUrl}${target.path}`, {
      waitUntil: 'commit',
      timeout: 60_000,
    });

    if (response && response.status() >= 400) {
      throw new Error(`HTTP ${response.status()} for ${target.path}`);
    }

    await settle(page);
    await assertRendered(page, target);

    if (target.linkSelector) {
      const link = page.locator(target.linkSelector).first();
      await link.waitFor({ state: 'visible', timeout: 30_000 });
      await link.click();
      await settle(page);
      await assertRendered(page, { name: target.name });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(outputDir, fileName), animations: 'disabled' });
    console.log(`captured ${fileName}`);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (target.optional) {
      console.warn(`skipped ${fileName}: ${reason}`);
      return true;
    }
    console.error(`failed ${fileName}: ${reason}`);
    return false;
  } finally {
    await page.close();
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  let ok = true;

  try {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport,
        colorScheme: theme,
        reducedMotion: 'reduce',
      });
      // next-themes reads the persisted preference before first paint.
      await context.addInitScript(
        ([key, value]) => window.localStorage.setItem(key, value),
        ['theme', theme]
      );

      try {
        for (const target of selected) {
          ok = (await capture(context, target, theme)) && ok;
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

await main();
