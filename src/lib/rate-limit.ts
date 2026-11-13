/**
 * Postgres-backed daily rate limiting (ApiUsage table). In-process counters do
 * not work on serverless, where each invocation may be a fresh instance.
 *
 * The store is injectable so the policy can be tested without a database.
 */

export interface UsageStore {
  /** Atomically add one to the (day, route) counter and return the new count. */
  increment(day: string, route: string): Promise<number>;
}

export interface RateLimitOptions {
  /** Stable route or feature name, for example "ai-summarize". */
  route: string;
  /** Maximum allowed requests per UTC day. */
  limit: number;
  store?: UsageStore;
  now?: () => Date;
  /** What to do when the store fails. Defaults to 'deny' so a database outage cannot lift a cost cap. */
  onStoreError?: 'allow' | 'deny';
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** When the current UTC-day window resets. */
  resetAt: Date;
}

export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function nextUtcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
}

export function createPrismaUsageStore(): UsageStore {
  return {
    async increment(day, route) {
      const { getPrisma } = await import('./prisma');
      const { withDbRetry } = await import('./db-retry');
      const row = await withDbRetry(
        () =>
          getPrisma().apiUsage.upsert({
            where: { day_route: { day, route } },
            create: { day, route, count: 1 },
            update: { count: { increment: 1 } },
            select: { count: true },
          }),
        'api usage increment'
      );
      return row.count;
    },
  };
}

/** Count one request against the route's daily quota and report whether it fits. */
export async function consumeDailyQuota({
  route,
  limit,
  store = createPrismaUsageStore(),
  now = () => new Date(),
  onStoreError = 'deny',
}: RateLimitOptions): Promise<RateLimitResult> {
  const current = now();
  const resetAt = nextUtcDayStart(current);

  try {
    const count = await store.increment(utcDayKey(current), route);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch (error) {
    console.error(`Rate limit store failed for ${route}`, error);
    const allowed = onStoreError === 'allow';
    return { allowed, limit, remaining: allowed ? limit : 0, resetAt };
  }
}

/** Standard headers for a 429 response built from a denied result. */
export function rateLimitHeaders(result: RateLimitResult, now: Date = new Date()): Record<string, string> {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000));
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(retryAfterSeconds) }),
  };
}
