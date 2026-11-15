/**
 * Release plan section of the briefing, behind a small provider interface.
 *
 * releaseplans.microsoft.com (Release Planner) is retired and redirects to the
 * Microsoft 365 roadmap page, so live data may be empty. Callers must handle
 * the 'unavailable' result; the email then carries a clear note instead of a
 * silent gap.
 */

import { stripHtml } from '../feed/sanitize';
import { matchesScope, type BriefingProduct, type BriefingScope } from './model';
import { addDays, formatIsoDateLabel, parseIsoDate, toIsoDate } from './week';

export interface ReleasePlanRecord {
  id: string;
  title: string;
  product: string;
  businessValue?: string;
  content?: string;
  publicPreviewDate?: string;
  gaDate?: string;
}

export interface ReleasePlanFeature {
  id: string;
  name: string;
  product: string;
  phaseLabel: string;
  benefit: string;
}

export type ReleasePlanResult =
  | { status: 'ok'; features: ReleasePlanFeature[]; note: string }
  | { status: 'unavailable'; note: string };

export interface ReleasePlanProvider {
  name: string;
  getReleasePlans(): Promise<ReleasePlanRecord[]>;
}

export const RELEASE_PLAN_UNAVAILABLE_NOTE =
  'Release plan data is currently unavailable: the Release Planner source has been retired. Check the Microsoft 365 roadmap for upcoming features.';

/** Days after the briefing Monday that count as "coming soon". */
export const RELEASE_PLAN_LOOKAHEAD_DAYS = 60;

function productFor(name: string): BriefingProduct | null {
  if (/copilot studio/i.test(name)) return 'copilot-studio';
  if (/power apps|power automate|power pages|dataverse|power platform|ai builder/i.test(name)) {
    return 'power-platform';
  }
  return null;
}

function normalizeDate(value: string | undefined): string {
  if (!value) return '';
  const direct = parseIsoDate(value.slice(0, 10));
  if (direct) return toIsoDate(direct);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : toIsoDate(parsed);
}

function trimText(text: string, maxLength: number): string {
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…`;
}

/** Features whose preview or GA date falls in [weekKey, weekKey + lookahead), soonest first. */
export function selectUpcomingFeatures(
  records: ReleasePlanRecord[],
  weekKey: string,
  scope: BriefingScope
): ReleasePlanFeature[] {
  const start = parseIsoDate(weekKey);
  if (!start) return [];
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(addDays(start, RELEASE_PLAN_LOOKAHEAD_DAYS));
  const inRange = (iso: string) => Boolean(iso) && iso >= startIso && iso < endIso;

  const rows: { feature: ReleasePlanFeature; sortKey: string }[] = [];
  for (const record of records) {
    const product = productFor(record.product);
    if (!product || !matchesScope(product, scope) || !record.title) continue;

    const preview = normalizeDate(record.publicPreviewDate);
    const ga = normalizeDate(record.gaDate);
    const dates = [preview, ga].filter(inRange).sort();
    if (!dates.length) continue;

    const phases: string[] = [];
    if (inRange(preview)) phases.push(`Preview ${formatIsoDateLabel(preview)}`);
    if (inRange(ga)) phases.push(`GA ${formatIsoDateLabel(ga)}`);

    rows.push({
      sortKey: dates[0],
      feature: {
        id: record.id,
        name: record.title,
        product: record.product,
        phaseLabel: phases.join(' · '),
        benefit: trimText(stripHtml(record.businessValue || record.content || ''), 200),
      },
    });
  }

  return rows
    .sort(
      (a, b) => a.sortKey.localeCompare(b.sortKey) || a.feature.name.localeCompare(b.feature.name)
    )
    .map(row => row.feature);
}

/** Never throws: any provider failure or empty feed degrades to an 'unavailable' note. */
export async function loadReleasePlanSection(
  provider: ReleasePlanProvider,
  weekKey: string,
  scope: BriefingScope
): Promise<ReleasePlanResult> {
  try {
    const records = await provider.getReleasePlans();
    if (!records.length) {
      return { status: 'unavailable', note: RELEASE_PLAN_UNAVAILABLE_NOTE };
    }
    return {
      status: 'ok',
      features: selectUpcomingFeatures(records, weekKey, scope),
      note: `Preview or GA in the next ${RELEASE_PLAN_LOOKAHEAD_DAYS} days`,
    };
  } catch {
    return { status: 'unavailable', note: RELEASE_PLAN_UNAVAILABLE_NOTE };
  }
}
