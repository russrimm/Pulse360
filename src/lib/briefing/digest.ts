/**
 * Message Center digest export (CSV, JSON, Markdown) for the Power Platform
 * and Copilot Studio posts of a rolling window. Pure formatting; the route in
 * src/app/api/briefing/digest/route.ts supplies the data and the access gate.
 */

import {
  PRODUCT_LABELS,
  getBriefingArea,
  selectWindowItems,
  type BriefingItem,
  type BriefingSource,
} from './model';
import { rollingWindow } from './week';

export type DigestFormat = 'csv' | 'json' | 'md';

export const DIGEST_FORMATS: DigestFormat[] = ['csv', 'json', 'md'];
export const DEFAULT_DIGEST_DAYS = 7;
export const MAX_DIGEST_DAYS = 90;

export interface Digest {
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  days: number;
  count: number;
  items: BriefingItem[];
}

export type DigestParams =
  { ok: true; days: number; format: DigestFormat } | { ok: false; error: string };

export function parseDigestParams(searchParams: URLSearchParams): DigestParams {
  const rawFormat = (searchParams.get('format') ?? 'csv').toLowerCase();
  if (!DIGEST_FORMATS.includes(rawFormat as DigestFormat)) {
    return { ok: false, error: `format must be one of: ${DIGEST_FORMATS.join(', ')}` };
  }

  const rawDays = searchParams.get('days');
  let days = DEFAULT_DIGEST_DAYS;
  if (rawDays !== null) {
    if (!/^\d{1,3}$/.test(rawDays)) {
      return { ok: false, error: `days must be a whole number from 1 to ${MAX_DIGEST_DAYS}` };
    }
    days = Number(rawDays);
    if (days < 1 || days > MAX_DIGEST_DAYS) {
      return { ok: false, error: `days must be a whole number from 1 to ${MAX_DIGEST_DAYS}` };
    }
  }

  return { ok: true, days, format: rawFormat as DigestFormat };
}

export function buildDigest(sources: BriefingSource[], now: Date, days: number): Digest {
  const window = rollingWindow(now, days);
  const items = selectWindowItems(sources, window, 'both');
  return {
    generatedAt: now.toISOString(),
    windowStart: window.start.toISOString(),
    windowEnd: now.toISOString(),
    days,
    count: items.length,
    items,
  };
}

/**
 * Quote a CSV field and neutralize spreadsheet formulas: values that start
 * with = + - @ (after optional whitespace) or a tab/CR get a leading
 * apostrophe so Excel and Sheets treat them as text.
 */
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\t\r ]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const CSV_COLUMNS: { header: string; value: (item: BriefingItem) => unknown }[] = [
  { header: 'ID', value: item => item.id },
  { header: 'Title', value: item => item.title },
  { header: 'Product', value: item => PRODUCT_LABELS[item.product] },
  { header: 'Area', value: item => getBriefingArea(item.area).label },
  { header: 'Change', value: item => (item.change === 'updated' ? 'Updated' : 'New') },
  { header: 'Published', value: item => item.published },
  { header: 'Last updated', value: item => item.lastUpdated },
  { header: 'Action required by', value: item => item.actionRequiredBy ?? '' },
  { header: 'Action needed', value: item => (item.isAction ? 'Yes' : 'No') },
  { header: 'Major change', value: item => (item.isMajor ? 'Yes' : 'No') },
  { header: 'Severity', value: item => item.severity },
  { header: 'Key dates', value: item => item.keyDates.map(d => `${d.label} ${d.date}`).join('; ') },
  { header: 'Services', value: item => item.services.join('; ') },
  { header: 'Tags', value: item => item.tags.join('; ') },
  { header: 'Summary', value: item => item.summary },
  { header: 'Link', value: item => item.href },
];

/** UTF-8 BOM first so Excel detects the encoding. */
export function digestToCsv(digest: Digest): string {
  const lines = [CSV_COLUMNS.map(column => csvCell(column.header)).join(',')];
  for (const item of digest.items) {
    lines.push(CSV_COLUMNS.map(column => csvCell(column.value(item))).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function digestToJson(digest: Digest): string {
  return `${JSON.stringify(digest, null, 2)}\n`;
}

function mdCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, ' ');
}

export function digestToMarkdown(digest: Digest): string {
  const lines = [
    `# Power Platform & Copilot Studio Message Center digest`,
    '',
    `Last ${digest.days} ${digest.days === 1 ? 'day' : 'days'} (${digest.windowStart.slice(0, 10)} to ${digest.windowEnd.slice(0, 10)}, UTC) · ${digest.count} ${digest.count === 1 ? 'post' : 'posts'}`,
    '',
  ];
  if (!digest.items.length) {
    lines.push('No matching Message Center posts in this window.');
  } else {
    lines.push('| ID | Title | Product | Change | Published | Action | Key dates |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const item of digest.items) {
      const id = item.href ? `[${item.id}](${item.href})` : mdCell(item.id);
      lines.push(
        `| ${id} | ${mdCell(item.title)} | ${PRODUCT_LABELS[item.product]} | ${
          item.change === 'updated' ? 'Updated' : 'New'
        } | ${item.published} | ${item.isAction ? 'Yes' : 'No'} | ${mdCell(
          item.keyDates.map(d => `${d.label} ${d.date}`).join('; ')
        )} |`
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

export function formatDigest(
  digest: Digest,
  format: DigestFormat
): { body: string; contentType: string; extension: string } {
  switch (format) {
    case 'json':
      return {
        body: digestToJson(digest),
        contentType: 'application/json; charset=utf-8',
        extension: 'json',
      };
    case 'md':
      return {
        body: digestToMarkdown(digest),
        contentType: 'text/markdown; charset=utf-8',
        extension: 'md',
      };
    default:
      return {
        body: digestToCsv(digest),
        contentType: 'text/csv; charset=utf-8',
        extension: 'csv',
      };
  }
}

export function digestFilename(now: Date, days: number, extension: string): string {
  return `pulse360-message-center-digest-${now.toISOString().slice(0, 10)}-${days}d.${extension}`;
}
