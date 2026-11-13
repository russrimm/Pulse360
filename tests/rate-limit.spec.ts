/**
 * tests/rate-limit.spec.ts
 *
 * Daily quota policy and read-through cache behavior against in-memory stores.
 *
 * Run: pnpm exec playwright test tests/rate-limit.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

import {
  consumeDailyQuota,
  nextUtcDayStart,
  rateLimitHeaders,
  utcDayKey,
  type UsageStore,
} from '../src/lib/rate-limit';
import { buildCacheKey, getCached, purgeExpiredCache, withCache, type CacheStore } from '../src/lib/api-cache';

function memoryUsageStore(): UsageStore & { counts: Map<string, number> } {
  const counts = new Map<string, number>();
  return {
    counts,
    async increment(day, route) {
      const key = `${day}|${route}`;
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
  };
}

function memoryCacheStore(): CacheStore & { rows: Map<string, { payload: unknown; expiresAt: Date }> } {
  const rows = new Map<string, { payload: unknown; expiresAt: Date }>();
  return {
    rows,
    async get(key) {
      return rows.get(key) ?? null;
    },
    async set(key, payload, expiresAt) {
      rows.set(key, { payload, expiresAt });
    },
    async deleteExpired(now) {
      let removed = 0;
      for (const [key, row] of rows) {
        if (row.expiresAt <= now) {
          rows.delete(key);
          removed += 1;
        }
      }
      return removed;
    },
  };
}

test.describe('consumeDailyQuota', () => {
  const noon = new Date('2026-11-13T12:00:00Z');

  test('allows requests up to the limit, then denies', async () => {
    const store = memoryUsageStore();
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await consumeDailyQuota({ route: 'ai', limit: 3, store, now: () => noon }));
    }
    expect(results.map(result => result.allowed)).toEqual([true, true, true, false]);
    expect(results.map(result => result.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[0].resetAt.toISOString()).toBe('2026-11-14T00:00:00.000Z');
  });

  test('counts per route and resets on the next UTC day', async () => {
    const store = memoryUsageStore();
    await consumeDailyQuota({ route: 'a', limit: 1, store, now: () => noon });
    expect((await consumeDailyQuota({ route: 'b', limit: 1, store, now: () => noon })).allowed).toBe(true);
    expect((await consumeDailyQuota({ route: 'a', limit: 1, store, now: () => noon })).allowed).toBe(false);
    const tomorrow = new Date('2026-11-14T00:00:01Z');
    expect((await consumeDailyQuota({ route: 'a', limit: 1, store, now: () => tomorrow })).allowed).toBe(true);
  });

  test('fails closed on store errors unless asked to allow', async () => {
    const store: UsageStore = {
      async increment() {
        throw new Error('db down');
      },
    };
    const quiet = console.error;
    console.error = () => {};
    try {
      expect((await consumeDailyQuota({ route: 'a', limit: 5, store })).allowed).toBe(false);
      expect(
        (await consumeDailyQuota({ route: 'a', limit: 5, store, onStoreError: 'allow' })).allowed
      ).toBe(true);
    } finally {
      console.error = quiet;
    }
  });

  test('day keys are UTC and headers include Retry-After only when denied', () => {
    expect(utcDayKey(new Date('2026-11-13T23:59:59-06:00'))).toBe('2026-11-14');
    expect(nextUtcDayStart(new Date('2026-12-31T10:00:00Z')).toISOString()).toBe(
      '2027-01-01T00:00:00.000Z'
    );
    const resetAt = new Date('2026-11-14T00:00:00Z');
    const now = new Date('2026-11-13T23:00:00Z');
    expect(rateLimitHeaders({ allowed: false, limit: 3, remaining: 0, resetAt }, now)['Retry-After']).toBe(
      '3600'
    );
    expect(rateLimitHeaders({ allowed: true, limit: 3, remaining: 2, resetAt }, now)).not.toHaveProperty(
      'Retry-After'
    );
  });
});

test.describe('api cache', () => {
  test('withCache loads once within the TTL and reloads after expiry', async () => {
    const store = memoryCacheStore();
    let clock = new Date('2026-11-13T12:00:00Z');
    const options = { store, now: () => clock };
    let loads = 0;
    const loader = async () => ({ loads: ++loads });

    expect(await withCache('k', 60, loader, options)).toEqual({ loads: 1 });
    expect(await withCache('k', 60, loader, options)).toEqual({ loads: 1 });

    clock = new Date('2026-11-13T12:01:01Z');
    expect(await withCache('k', 60, loader, options)).toEqual({ loads: 2 });
  });

  test('store failures degrade to a miss instead of throwing', async () => {
    const broken: CacheStore = {
      async get() {
        throw new Error('db down');
      },
      async set() {
        throw new Error('db down');
      },
      async deleteExpired() {
        return 0;
      },
    };
    const quiet = console.error;
    console.error = () => {};
    try {
      expect(await getCached('k', { store: broken })).toBeUndefined();
      expect(await withCache('k', 60, async () => 'fresh', { store: broken })).toBe('fresh');
    } finally {
      console.error = quiet;
    }
  });

  test('purgeExpiredCache removes only expired rows and keys are stable', async () => {
    const store = memoryCacheStore();
    const now = new Date('2026-11-13T12:00:00Z');
    await store.set('old', 1, new Date('2026-11-13T11:00:00Z'));
    await store.set('new', 2, new Date('2026-11-13T13:00:00Z'));
    expect(await purgeExpiredCache({ store, now: () => now })).toBe(1);
    expect([...store.rows.keys()]).toEqual(['new']);

    expect(buildCacheKey('ai', { a: 1 })).toBe(buildCacheKey('ai', { a: 1 }));
    expect(buildCacheKey('ai', { a: 1 })).not.toBe(buildCacheKey('ai', { a: 2 }));
    expect(buildCacheKey('ai', 'x')).toMatch(/^ai:[0-9a-f]{64}$/);
  });
});
