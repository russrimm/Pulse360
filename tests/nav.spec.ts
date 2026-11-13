/**
 * tests/nav.spec.ts
 *
 * Data-driven navigation registry: shape invariants and active-state matching.
 *
 * Run: pnpm exec playwright test tests/nav.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

import { NAV_ITEMS, findActiveNavItem, isNavItemActive } from '../src/lib/nav';

test('entries are unique, rooted, and cover the shipped sections', () => {
  const hrefs = NAV_ITEMS.map(item => item.href);
  expect(new Set(hrefs).size).toBe(hrefs.length);
  expect(hrefs).toEqual([
    '/home',
    '/message-center',
    '/service-health',
    '/release-plans',
    '/product-news',
    '/security',
    '/ms-lifecycle',
  ]);

  for (const item of NAV_ITEMS) {
    expect(item.href.startsWith('/')).toBe(true);
    expect(item.matches).toContain(item.href.replace(/\/$/, ''));
    for (const child of item.children ?? []) {
      expect(child.href.startsWith('/')).toBe(true);
    }
  }
});

test('active matching is exact or by path segment, never by raw prefix', () => {
  const messageCenter = NAV_ITEMS.find(item => item.href === '/message-center')!;
  expect(isNavItemActive(messageCenter, '/message-center')).toBe(true);
  expect(isNavItemActive(messageCenter, '/message/abc')).toBe(true);
  expect(isNavItemActive(messageCenter, '/messages-archive')).toBe(false);
});

test('child routes and legacy detail routes resolve to their parent section', () => {
  expect(findActiveNavItem('/release-plans/fabric')?.href).toBe('/release-plans');
  expect(findActiveNavItem('/azure-update/123')?.href).toBe('/release-plans');
  expect(findActiveNavItem('/msrc')?.href).toBe('/security');
  expect(findActiveNavItem('/product-news/author/someone')?.href).toBe('/product-news');
  expect(findActiveNavItem('/unknown')).toBeUndefined();
});

test('a custom registry works, so features only add an entry', () => {
  const items = [
    ...NAV_ITEMS,
    {
      name: 'Briefing',
      fullName: 'Weekly Briefing',
      href: '/briefing',
      matches: ['/briefing'],
      icon: { kind: 'symbol', name: 'news' } as const,
    },
  ];
  expect(findActiveNavItem('/briefing/edit', items)?.name).toBe('Briefing');
});
