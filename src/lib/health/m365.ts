import 'server-only';

import { buildCacheKey, withCache } from '@/lib/api-cache';
import { getGraphConfig } from '@/lib/graph-token';
import { consumeDailyQuota } from '@/lib/rate-limit';
import { HealthError } from './errors';
import { fetchM365Health, fetchM365Issue } from './graph-health';
import { isValidHealthIssueId } from './status';
import type { HealthEvent, HealthSnapshot } from './types';

const CACHE_TTL_SECONDS = 60;
const MEMO_OK_MS = 30_000;
// Failures are remembered briefly so a 403 or throttle is not retried by every page view.
const MEMO_FAILURE_MS = 15_000;
const MEMO_MAX_ENTRIES = 200;
const DAILY_GRAPH_LOAD_LIMIT = 2_000;

interface MemoEntry {
  expiresAt: number;
  promise: Promise<unknown>;
}

const memo = new Map<string, MemoEntry>();

/** Per-instance dedupe in front of the shared Postgres cache (and the only cache without a database). */
function memoize<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise as Promise<T>;

  if (memo.size >= MEMO_MAX_ENTRIES) {
    const oldest = memo.keys().next().value;
    if (oldest !== undefined) memo.delete(oldest);
  }
  const entry: MemoEntry = { expiresAt: Date.now() + MEMO_OK_MS, promise: load() };
  memo.set(key, entry);
  entry.promise.catch(() => {
    entry.expiresAt = Date.now() + MEMO_FAILURE_MS;
  });
  return entry.promise as Promise<T>;
}

export function isM365HealthConfigured(): boolean {
  return getGraphConfig().hasRequiredEnvVars;
}

async function loadWithQuota<T>(run: () => Promise<T>): Promise<T> {
  if (process.env.DATABASE_URL) {
    const quota = await consumeDailyQuota({
      route: 'm365-health-graph',
      limit: DAILY_GRAPH_LOAD_LIMIT,
      // A database outage must not take service health offline.
      onStoreError: 'allow',
    });
    if (!quota.allowed) {
      throw new HealthError('quota', 'Daily Service Health refresh limit reached');
    }
  }
  return run();
}

function cached<T>(key: string, run: () => Promise<T>): Promise<T> {
  const load = () => loadWithQuota(run);
  return process.env.DATABASE_URL ? withCache(key, CACHE_TTL_SECONDS, load) : load();
}

/** Tenant service status and recent issues. Throws HealthError. */
export function getM365Health(): Promise<HealthSnapshot> {
  return memoize('snapshot', () =>
    cached(buildCacheKey('m365-health', 'snapshot'), () => fetchM365Health())
  );
}

/** One issue by ID, or null when it does not exist. Throws HealthError for other failures. */
export async function getM365HealthIssue(id: string): Promise<HealthEvent | null> {
  if (!isValidHealthIssueId(id)) return null;

  let snapshot: HealthSnapshot | null = null;
  try {
    snapshot = await getM365Health();
  } catch {
    // Fall through to a direct lookup, which reports its own error.
  }
  const listed = snapshot?.events.find(event => event.id === id);
  if (listed) return listed;

  try {
    return await memoize(`issue:${id}`, () =>
      cached(buildCacheKey('m365-health-issue', id), async () => {
        const issue = await fetchM365Issue(id);
        // Not cached: a null payload cannot be stored as JSON.
        if (!issue) throw new HealthError('not-found', 'Issue not found', 404);
        return issue;
      })
    );
  } catch (error) {
    if (error instanceof HealthError && error.kind === 'not-found') return null;
    throw error;
  }
}
