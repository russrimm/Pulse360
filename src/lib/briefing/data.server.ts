import 'server-only';

import { getPrisma } from '@/lib/prisma';
import { withDbRetry } from '@/lib/db-retry';
import type { Prisma } from '@/generated/prisma';
import type { BriefingModel, BriefingScope, BriefingSource } from './model';
import { buildBriefingModel } from './model';
import {
  modelFromSnapshots,
  saveBriefingSnapshots,
  type BriefingSnapshotPayload,
  type BriefingSnapshotStore,
} from './snapshot';
import { weekKeyFor, weekWindow, type DateWindow } from './week';

const sourceSelect = {
  id: true,
  title: true,
  service: true,
  tags: true,
  content: true,
  summary: true,
  isMajorChange: true,
  severity: true,
  actionRequiredByDateTime: true,
  published: true,
  lastUpdated: true,
  firstSeenAt: true,
} satisfies Prisma.MessageCenterUpdateSelect;

/** Message Center rows published or modified inside `window`, as plain serializable sources. */
export async function fetchBriefingSources(window: DateWindow): Promise<BriefingSource[]> {
  const range = { gte: window.start, lt: window.end };
  const rows = await withDbRetry(
    () =>
      getPrisma().messageCenterUpdate.findMany({
        select: sourceSelect,
        where: {
          OR: [
            { published: range },
            { lastUpdated: range },
            { published: null, firstSeenAt: range },
          ],
        },
      }),
    'fetchBriefingSources'
  );

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    service: row.service,
    tags: row.tags,
    content: row.content,
    summary: row.summary,
    isMajorChange: row.isMajorChange,
    severity: row.severity,
    actionRequiredByDateTime: row.actionRequiredByDateTime?.toISOString() ?? null,
    published: (row.published ?? row.firstSeenAt).toISOString(),
    lastUpdated: row.lastUpdated?.toISOString() ?? null,
  }));
}

function snapshotStore(): BriefingSnapshotStore {
  const delegate = getPrisma().briefingSnapshot;
  return {
    upsert: args =>
      withDbRetry(
        () =>
          delegate.upsert({
            where: args.where,
            create: {
              ...args.create,
              payload: args.create.payload as unknown as Prisma.InputJsonValue,
            },
            update: { payload: args.update.payload as unknown as Prisma.InputJsonValue },
          }),
        'briefingSnapshot.upsert'
      ),
  };
}

/** Build and upsert both products' snapshots for `weekKey` from live Message Center data. */
export async function snapshotBriefingWeek(
  weekKey: string,
  now: Date = new Date()
): Promise<BriefingSnapshotPayload[]> {
  const sources = await fetchBriefingSources(weekWindow(weekKey));
  return saveBriefingSnapshots(snapshotStore(), sources, weekKey, now);
}

async function readSnapshots(weekKey: string): Promise<BriefingSnapshotPayload[]> {
  const rows = await withDbRetry(
    () => getPrisma().briefingSnapshot.findMany({ where: { weekKey } }),
    'briefingSnapshot.findMany'
  );
  return rows.map(row => row.payload as unknown as BriefingSnapshotPayload);
}

export interface LoadedBriefing {
  model: BriefingModel;
  source: 'live' | 'snapshot';
}

/**
 * Past weeks come from the Monday snapshot when one exists; the current week,
 * future weeks, and weeks without a snapshot are built from live data.
 */
export async function loadBriefing(
  weekKey: string,
  scope: BriefingScope,
  now: Date = new Date()
): Promise<LoadedBriefing> {
  if (weekKey < weekKeyFor(now)) {
    try {
      const model = modelFromSnapshots(weekKey, scope, await readSnapshots(weekKey));
      if (model) return { model, source: 'snapshot' };
    } catch (error) {
      console.error('Briefing snapshot lookup failed; using live data:', error);
    }
  }

  const sources = await fetchBriefingSources(weekWindow(weekKey));
  return { model: buildBriefingModel(sources, weekKey, scope), source: 'live' };
}
