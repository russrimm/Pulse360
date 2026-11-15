import 'server-only';

import { getM365Updates } from '@/lib/api.server';
import type { ReleasePlanProvider, ReleasePlanRecord } from './release-plan';

const CACHE_TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 10_000;

let cached: { records: ReleasePlanRecord[]; cachedAt: number } | undefined;

/**
 * Default provider backed by the AI at Work roadmap (getM365Updates), which now
 * includes the Dynamics 365 and Power Platform plans. Results (including an empty
 * result) are cached in memory for an hour and the call is bounded by a timeout.
 */
export const releasePlannerProvider: ReleasePlanProvider = {
  name: 'release-planner',
  async getReleasePlans() {
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.records;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Release plan fetch timed out')), TIMEOUT_MS);
    });
    try {
      const plans = await Promise.race([getM365Updates(), timeout]);
      const records: ReleasePlanRecord[] = plans.map(plan => ({
        id: plan.id,
        title: plan.title,
        product: plan.product,
        content: plan.content,
        publicPreviewDate: plan.previewAvailabilityDate || undefined,
        gaDate: plan.generalAvailabilityDate || undefined,
      }));
      cached = { records, cachedAt: Date.now() };
      return records;
    } catch {
      // Negative-cache failures so a dead source does not add a timeout to every request.
      cached = { records: [], cachedAt: Date.now() };
      return [];
    } finally {
      clearTimeout(timer);
    }
  },
};
