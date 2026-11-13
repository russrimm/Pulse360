import 'server-only';
import { getAzureUpdates, getM365Updates } from '@/lib/api.server';
import { normalizeFeedText } from '@/lib/feed/text';
import type { AzureUpdate, M365Update } from '@/lib/types';

/**
 * List pages only need a short excerpt per update. The upstream M365 feed is
 * ~2.7 MB, which exceeds Next's 2 MB fetch-cache limit (so it is fetched with
 * `no-store`) and used to be serialized to the browser in full. These helpers
 * keep a slimmed copy in memory so list requests neither re-download nor
 * re-ship the full descriptions. Detail pages still fetch full content.
 */
const EXCERPT_LENGTH = 320;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function createTtlMemo<T>(load: () => Promise<T[]>) {
  let entry: CacheEntry<T[]> | null = null;
  let inflight: Promise<T[]> | null = null;

  return async function read(): Promise<T[]> {
    if (entry && entry.expiresAt > Date.now()) return entry.value;
    if (inflight) return inflight;

    inflight = load()
      .then(value => {
        // An empty result usually means the upstream failed; do not pin it.
        if (value.length > 0) entry = { value, expiresAt: Date.now() + CACHE_TTL_MS };
        return value;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
}

export function toExcerpt(html: string, maxLength: number = EXCERPT_LENGTH): string {
  const text = normalizeFeedText(html ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export const getM365UpdateSummaries = createTtlMemo<M365Update>(async () => {
  const updates = await getM365Updates();
  return updates.map(update => ({ ...update, content: toExcerpt(update.content) }));
});

export const getAzureUpdateSummaries = createTtlMemo<AzureUpdate>(async () => {
  const updates = await getAzureUpdates();
  return updates.map(update => ({ ...update, description: toExcerpt(update.description) }));
});
