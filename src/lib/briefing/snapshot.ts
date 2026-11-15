/**
 * Weekly snapshots: the Monday cron stores each product's briefing items for
 * the week in the BriefingSnapshot table so past weeks stay stable after
 * Message Center posts age out or change. Writes are upserts keyed by
 * (weekKey, product), so re-running the cron for the same week is idempotent.
 */

import {
  BRIEFING_PRODUCTS,
  buildBriefingModel,
  compareItems,
  type BriefingItem,
  type BriefingModel,
  type BriefingProduct,
  type BriefingScope,
  type BriefingSource,
} from './model';

export interface BriefingSnapshotPayload {
  weekKey: string;
  product: BriefingProduct;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  items: BriefingItem[];
}

export interface BriefingSnapshotUpsertArgs {
  where: { weekKey_product: { weekKey: string; product: BriefingProduct } };
  create: { weekKey: string; product: BriefingProduct; payload: BriefingSnapshotPayload };
  update: { payload: BriefingSnapshotPayload };
}

/** The slice of the Prisma delegate the snapshot writer needs. */
export interface BriefingSnapshotStore {
  upsert(args: BriefingSnapshotUpsertArgs): Promise<unknown>;
}

export function buildSnapshotPayloads(
  sources: BriefingSource[],
  weekKey: string,
  now: Date
): BriefingSnapshotPayload[] {
  return BRIEFING_PRODUCTS.map(product => {
    const model = buildBriefingModel(sources, weekKey, product);
    return {
      weekKey,
      product,
      generatedAt: now.toISOString(),
      windowStart: model.windowStart,
      windowEnd: model.windowEnd,
      items: model.items,
    };
  });
}

export async function saveBriefingSnapshots(
  store: BriefingSnapshotStore,
  sources: BriefingSource[],
  weekKey: string,
  now: Date
): Promise<BriefingSnapshotPayload[]> {
  const payloads = buildSnapshotPayloads(sources, weekKey, now);
  for (const payload of payloads) {
    await store.upsert({
      where: { weekKey_product: { weekKey, product: payload.product } },
      create: { weekKey, product: payload.product, payload },
      update: { payload },
    });
  }
  return payloads;
}

/** Rebuild a briefing model from stored snapshots; null unless every product in scope has one. */
export function modelFromSnapshots(
  weekKey: string,
  scope: BriefingScope,
  snapshots: BriefingSnapshotPayload[]
): BriefingModel | null {
  const needed = scope === 'both' ? BRIEFING_PRODUCTS : [scope];
  const matching = needed.map(product =>
    snapshots.find(snapshot => snapshot.weekKey === weekKey && snapshot.product === product)
  );
  if (matching.some(snapshot => !snapshot)) return null;

  const found = matching as BriefingSnapshotPayload[];
  const items = found.flatMap(snapshot => snapshot.items).sort(compareItems);
  return {
    weekKey,
    scope,
    windowStart: found[0].windowStart,
    windowEnd: found[0].windowEnd,
    items,
  };
}
