/**
 * Postgres-backed key/value cache with TTL (ApiCache table). Safe on
 * serverless, unlike module-level Maps. Cache failures never break a request:
 * reads fall back to a miss and writes are best effort.
 */
import { createHash } from 'node:crypto';

export interface CacheStore {
  get(key: string): Promise<{ payload: unknown; expiresAt: Date } | null>;
  set(key: string, payload: unknown, expiresAt: Date): Promise<void>;
  deleteExpired(now: Date): Promise<number>;
}

export interface CacheOptions {
  store?: CacheStore;
  now?: () => Date;
}

/** Stable, namespaced key: hashes arbitrary input so keys stay short and safe. */
export function buildCacheKey(namespace: string, input: unknown): string {
  const serialized = typeof input === 'string' ? input : JSON.stringify(input);
  return `${namespace}:${createHash('sha256').update(serialized).digest('hex')}`;
}

export function createPrismaCacheStore(): CacheStore {
  return {
    async get(key) {
      const { getPrisma } = await import('./prisma');
      const { withDbRetry } = await import('./db-retry');
      const row = await withDbRetry(
        () => getPrisma().apiCache.findUnique({ where: { key } }),
        'api cache read'
      );
      return row ? { payload: row.payload, expiresAt: row.expiresAt } : null;
    },
    async set(key, payload, expiresAt) {
      const { getPrisma } = await import('./prisma');
      const { withDbRetry } = await import('./db-retry');
      const data = payload as never;
      await withDbRetry(
        () =>
          getPrisma().apiCache.upsert({
            where: { key },
            create: { key, payload: data, expiresAt },
            update: { payload: data, expiresAt },
          }),
        'api cache write'
      );
    },
    async deleteExpired(now) {
      const { getPrisma } = await import('./prisma');
      const result = await getPrisma().apiCache.deleteMany({ where: { expiresAt: { lte: now } } });
      return result.count;
    },
  };
}

/** Returns the cached value, or undefined on a miss, an expired row, or a store error. */
export async function getCached<T>(
  key: string,
  { store = createPrismaCacheStore(), now = () => new Date() }: CacheOptions = {}
): Promise<T | undefined> {
  try {
    const row = await store.get(key);
    if (!row || row.expiresAt.getTime() <= now().getTime()) return undefined;
    return row.payload as T;
  } catch (error) {
    console.error(`Cache read failed for ${key}`, error);
    return undefined;
  }
}

export async function setCached(
  key: string,
  payload: unknown,
  ttlSeconds: number,
  { store = createPrismaCacheStore(), now = () => new Date() }: CacheOptions = {}
): Promise<void> {
  try {
    await store.set(key, payload, new Date(now().getTime() + ttlSeconds * 1000));
  } catch (error) {
    console.error(`Cache write failed for ${key}`, error);
  }
}

/** Read-through helper: return the cached value or compute, store, and return it. */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const hit = await getCached<T>(key, options);
  if (hit !== undefined) return hit;

  const value = await loader();
  await setCached(key, value, ttlSeconds, options);
  return value;
}

/** Housekeeping for a cron or opportunistic cleanup. */
export async function purgeExpiredCache({
  store = createPrismaCacheStore(),
  now = () => new Date(),
}: CacheOptions = {}): Promise<number> {
  return store.deleteExpired(now());
}
