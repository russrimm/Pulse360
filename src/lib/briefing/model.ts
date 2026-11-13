/**
 * Weekly Customer Briefing data model (pure; safe on the server and in the
 * browser). Turns raw Message Center posts into prioritized briefing items and
 * builds the email view model from an editable draft.
 *
 * Adapted from the MicrosoftCommunicationsPortal sample (MIT, © 2025 Microsoft
 * Corporation). All Message Center HTML is sanitized before any text, link, or
 * summary is derived from it; the email renderers then escape every value.
 */

import { sanitizeFeedHtml } from '../feed/sanitize';
import {
  addDays,
  formatIsoDateLabel,
  formatLongDate,
  formatWindowLabel,
  isInWindow,
  parseIsoDate,
  toIsoDate,
  weekWindow,
  type DateWindow,
} from './week';
import type { ReleasePlanFeature, ReleasePlanResult } from './release-plan';

export type BriefingProduct = 'power-platform' | 'copilot-studio';
export type BriefingScope = BriefingProduct | 'both';
export type BriefingAreaKey =
  | 'copilotstudio'
  | 'governance'
  | 'dataverse'
  | 'powerautomate'
  | 'powerapps'
  | 'powerpages'
  | 'other';
export type BriefingActionReason = 'deadline' | 'prepare' | 'retirement';

export const BRIEFING_PRODUCTS: BriefingProduct[] = ['power-platform', 'copilot-studio'];

export const PRODUCT_LABELS: Record<BriefingProduct, string> = {
  'power-platform': 'Power Platform',
  'copilot-studio': 'Copilot Studio',
};

export interface BriefingArea {
  key: BriefingAreaKey;
  label: string;
  color: string;
}

/** Product areas in reader priority order. */
export const BRIEFING_AREAS: BriefingArea[] = [
  { key: 'copilotstudio', label: 'Copilot Studio', color: '#6d28d9' },
  { key: 'governance', label: 'Governance & admin', color: '#0f6cbd' },
  { key: 'dataverse', label: 'Dataverse', color: '#0e7a6a' },
  { key: 'powerautomate', label: 'Power Automate', color: '#0b5cad' },
  { key: 'powerapps', label: 'Power Apps', color: '#742774' },
  { key: 'powerpages', label: 'Power Pages', color: '#9a3412' },
  { key: 'other', label: 'Other Power Platform', color: '#4b5563' },
];

const AREA_BY_KEY = new Map(BRIEFING_AREAS.map(area => [area.key, area]));

export function getBriefingArea(key: BriefingAreaKey): BriefingArea {
  return AREA_BY_KEY.get(key) ?? BRIEFING_AREAS[BRIEFING_AREAS.length - 1];
}

/** Message Center post as stored in Postgres, with dates as ISO strings. */
export interface BriefingSource {
  id: string;
  title: string;
  service: string[];
  tags: string[];
  content: string;
  summary: string;
  isMajorChange: boolean;
  severity: string | null;
  actionRequiredByDateTime: string | null;
  published: string | null;
  lastUpdated: string | null;
}

export interface BriefingKeyDate {
  label: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface BriefingItem {
  key: string;
  id: string;
  title: string;
  cleanTitle: string;
  product: BriefingProduct;
  area: BriefingAreaKey;
  change: 'new' | 'updated';
  isMajor: boolean;
  isAction: boolean;
  actionReason: BriefingActionReason | null;
  severity: string;
  services: string[];
  tags: string[];
  summary: string;
  actionText: string;
  keyDates: BriefingKeyDate[];
  actionRequiredBy: string | null;
  /** YYYY-MM-DD */
  published: string;
  /** YYYY-MM-DD */
  lastUpdated: string;
  href: string;
  learnUrl: string;
}

export interface BriefingModel {
  weekKey: string;
  scope: BriefingScope;
  windowStart: string;
  windowEnd: string;
  /** Items in briefing order: action needed first. */
  items: BriefingItem[];
}

// ── Text helpers ────────────────────────────────────────────────────────────

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1]?.toLowerCase() === 'x'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return ENTITY_MAP[entity.toLowerCase()] ?? match;
  });
}

interface SectionHeading {
  key: 'affect' | 'action' | 'timing';
  pattern: RegExp;
}

const SECTION_HEADINGS: SectionHeading[] = [
  {
    key: 'affect',
    pattern:
      /^(?:how does this affect me\??|\[?how this will affect your organization:?\]?|\[?what and why:?\]?)$/i,
  },
  {
    key: 'action',
    pattern:
      /^(?:what (?:action )?do i need to (?:do to prepare|take)\??|\[?what you need to do to prepare:?\]?|what do i need to do\??)$/i,
  },
  {
    key: 'timing',
    pattern: /^(?:\[?when this will happen:?\]?|\[?rollout schedule:?\]?|timing)$/i,
  },
];

function isSectionHeading(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return SECTION_HEADINGS.some(heading => heading.pattern.test(normalized));
}

/**
 * Sanitize Message Center HTML and split it into text blocks. Bold text only
 * becomes its own block when it is a known section heading.
 */
export function htmlToBlocks(html: string): string[] {
  const safe = sanitizeFeedHtml(html);
  const text = safe
    .replace(/<(?:br|\/p|\/div|\/li|\/h\d|\/tr|\/ul|\/ol)\b[^>]*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_match, _tag: string, inner: string) => {
      const plainInner = decodeEntities(inner.replace(/<[^>]+>/g, ' '));
      return isSectionHeading(plainInner) ? `\n${plainInner}\n` : inner;
    })
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(text)
    .split('\n')
    .map(line =>
      line
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;:!?])(?=\s|$)/g, '$1')
        .trim()
    )
    .filter(Boolean);
}

function splitSections(blocks: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = { intro: [] };
  let current = 'intro';
  for (const block of blocks) {
    const heading = SECTION_HEADINGS.find(candidate => candidate.pattern.test(block));
    if (heading) {
      current = heading.key;
      sections[current] ??= [];
      continue;
    }
    sections[current] ??= [];
    sections[current].push(block);
  }
  return sections;
}

function splitSentences(text: string): string[] {
  const pattern = /[.!?]+["”’)]?(?=\s+(?:[A-Z0-9"“‘(•]|$))|[.!?]+["”’)]?$/g;
  const out: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    out.push(text.slice(last, match.index + match[0].length).trim());
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last).trim());
  return out.filter(Boolean);
}

function firstSentences(text: string, count: number, maxLength: number): string {
  const clean = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])(?=\s|$)/g, '$1')
    .trim();
  if (!clean) return '';
  const joined = splitSentences(clean).slice(0, count).join(' ');
  if (joined.length <= maxLength) return joined;
  return `${joined.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…`;
}

function firstLearnLink(html: string): string {
  const safe = sanitizeFeedHtml(html);
  const match =
    /href\s*=\s*["'](https:\/\/(?:learn\.microsoft\.com|aka\.ms)\/[^"'\s<>]+)["']/i.exec(safe);
  return match ? decodeEntities(match[1]) : '';
}

// ── Classification ─────────────────────────────────────────────────────────

const IN_SCOPE_SERVICE =
  /power platform|power automate|power apps|dataverse|copilot \(power platform\)|copilot studio|power pages/i;
const IN_SCOPE_TITLE =
  /copilot studio|power platform|power automate|power apps|power pages|dataverse/i;
const RETIREMENT =
  /\bretir(?:e|es|ed|ing|ement)\b|\bdeprecat|\bend of support\b|\bno longer (?:be )?(?:available|supported)\b/i;
const NO_ACTION = /no action is required|for awareness/i;
const TITLE_PREFIX =
  /^(?:(?:Microsoft )?Copilot Studio|Power Platform governance and administration|Power Platform admin center|(?:Microsoft )?Power Platform|(?:Microsoft )?Power Automate|(?:Microsoft )?Power Apps|Power Pages|(?:Microsoft )?Dataverse)\s*[-–—:]\s*/i;

export function isInScopeSource(source: Pick<BriefingSource, 'title' | 'service'>): boolean {
  return IN_SCOPE_SERVICE.test(source.service.join(' | ')) || IN_SCOPE_TITLE.test(source.title);
}

export function areaForSource(source: Pick<BriefingSource, 'title' | 'service'>): BriefingAreaKey {
  const title = source.title;
  const services = source.service.join(' | ');
  if (/copilot studio/i.test(title)) return 'copilotstudio';
  if (/power pages/i.test(title)) return 'powerpages';
  if (/governance|admin center|managed environment|environment group/i.test(title)) {
    return 'governance';
  }
  if (/power automate|process (?:mining|intelligence)|desktop flow|cloud flow/i.test(title)) {
    return 'powerautomate';
  }
  if (/power apps|canvas app|model-driven/i.test(title)) return 'powerapps';
  if (/dataverse|prompt column/i.test(title)) return 'dataverse';
  if (/copilot \(power platform\)/i.test(services)) return 'copilotstudio';
  if (/power automate/i.test(services)) return 'powerautomate';
  if (/power apps/i.test(services)) return 'powerapps';
  if (/dataverse/i.test(services)) return 'dataverse';
  if (/power platform/i.test(services)) return 'governance';
  return 'other';
}

export function productForArea(area: BriefingAreaKey): BriefingProduct {
  return area === 'copilotstudio' ? 'copilot-studio' : 'power-platform';
}

export function matchesScope(product: BriefingProduct, scope: BriefingScope): boolean {
  return scope === 'both' || scope === product;
}

export function parseScope(value: string | null | undefined): BriefingScope {
  return value === 'power-platform' || value === 'copilot-studio' ? value : 'both';
}

// ── Key dates ──────────────────────────────────────────────────────────────

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const DATE_PHRASE =
  '((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.? \\d{1,2}, \\d{4})';

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function parseDatePhrase(text: string): string {
  const match = /^([A-Za-z]+)\.? (\d{1,2}), (\d{4})$/.exec(text.trim());
  if (!match) return '';
  const key = match[1].toLowerCase();
  const month = MONTHS.findIndex(name => name === key || name.slice(0, 3) === key.slice(0, 3));
  const day = Number(match[2]);
  if (month < 0 || day < 1 || day > 31) return '';
  const iso = `${match[3]}-${pad(month + 1)}-${pad(day)}`;
  return parseIsoDate(iso) ? iso : '';
}

function extractKeyDates(
  text: string,
  publishedIso: string,
  actionRequiredBy: string | null,
  isRetirement: boolean
): BriefingKeyDate[] {
  const found: BriefingKeyDate[] = [];
  const add = (label: string, iso: string) => {
    if (!iso) return;
    // Dates before the post existed describe history, not what is coming.
    if (publishedIso && iso < publishedIso) return;
    if (found.some(entry => entry.date === iso)) return;
    found.push({ label, date: iso });
  };

  if (actionRequiredBy) add('Act by', actionRequiredBy);

  const patterns: { label: string; pattern: RegExp }[] = [
    {
      label: 'GA',
      pattern: new RegExp(
        `reach(?:ed|es)? general availability(?: \\(GA\\))? on ${DATE_PHRASE}`,
        'i'
      ),
    },
    {
      label: 'GA',
      pattern: new RegExp(`generally available (?:on|starting|beginning) ${DATE_PHRASE}`, 'i'),
    },
    {
      label: 'Preview',
      pattern: new RegExp(`reach(?:ed|es)? (?:public )?preview on ${DATE_PHRASE}`, 'i'),
    },
    {
      label: 'Rollout',
      pattern: new RegExp(
        `(?:complete|finish)(?:d|s)? (?:the )?(?:rollout|deployment) by (?:the week of )?${DATE_PHRASE}`,
        'i'
      ),
    },
    {
      label: 'Rollout',
      pattern: new RegExp(
        `(?:rollout|roll out|rolling out)[^.]{0,60}?(?:begin|begins|beginning|start|starts|starting|on)\\s+(?:on |in )?(?:the week of )?${DATE_PHRASE}`,
        'i'
      ),
    },
    {
      label: isRetirement ? 'Retires' : 'Starts',
      pattern: new RegExp(`(?:starting|beginning|effective) (?:on )?${DATE_PHRASE}`, 'i'),
    },
    {
      label: 'Retires',
      pattern: new RegExp(
        `(?:retire[sd]?|end of support|no longer (?:be )?(?:available|supported))[^.]{0,60}?(?:on|by|after) ${DATE_PHRASE}`,
        'i'
      ),
    },
  ];
  for (const { label, pattern } of patterns) {
    const match = pattern.exec(text);
    if (match) add(label, parseDatePhrase(match[1]));
  }

  // Posts whose wording matches no pattern still usually name the date that
  // matters: take the earliest one on or after the post's own publish date.
  if (!found.length) {
    const all = new RegExp(DATE_PHRASE, 'gi');
    let earliest = '';
    let hit: RegExpExecArray | null;
    while ((hit = all.exec(text)) !== null) {
      const iso = parseDatePhrase(hit[1]);
      if (iso && iso >= publishedIso && (!earliest || iso < earliest)) earliest = iso;
    }
    add('Date', earliest);
  }

  return found.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
}

// ── Items ──────────────────────────────────────────────────────────────────

/** Admin center deep link; public pages require tenant sign-in, so recipients get the source of truth. */
export function messageHref(id: string): string {
  return /^MC\d+$/i.test(id)
    ? `https://admin.microsoft.com/AdminPortal/home#/MessageCenter/:/messages/${encodeURIComponent(id.toUpperCase())}`
    : '';
}

function isoDay(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function isUpdatedPost(source: BriefingSource): boolean {
  return (
    /^\[updated[^\]]*\]\s*/i.test(source.title.trim()) ||
    source.tags.some(tag => /updated message/i.test(tag))
  );
}

export function buildBriefingItem(
  source: BriefingSource,
  change: 'new' | 'updated' = 'new'
): BriefingItem {
  const title = source.title.trim();
  const cleanTitle =
    title
      .replace(/^\[[^\]]+\]\s*/, '')
      .replace(TITLE_PREFIX, '')
      .trim() || title;
  const blocks = htmlToBlocks(source.content);
  const sections = splitSections(blocks);
  const fullText = blocks.join(' ');
  const tagText = source.tags.join(' ').toLowerCase();

  const summarySource =
    sections.affect?.join(' ') || sections.intro.join(' ') || source.summary || fullText;
  const summary = firstSentences(summarySource, 2, 280);
  const actionRaw = sections.action?.join(' ') ?? '';
  const actionText =
    actionRaw && !NO_ACTION.test(actionRaw) ? firstSentences(actionRaw, 3, 320) : '';
  const isRetirement = tagText.includes('retirement') || RETIREMENT.test(title);
  const actionRequiredBy = isoDay(source.actionRequiredByDateTime) || null;

  let actionReason: BriefingActionReason | null = null;
  if (actionRequiredBy) actionReason = 'deadline';
  else if (actionText) actionReason = 'prepare';
  else if (isRetirement) actionReason = 'retirement';

  const area = areaForSource(source);
  const published = isoDay(source.published);

  return {
    key: `mc:${source.id}`,
    id: source.id,
    title,
    cleanTitle,
    product: productForArea(area),
    area,
    change,
    isMajor: source.isMajorChange,
    isAction: actionReason !== null,
    actionReason,
    severity: source.severity ?? '',
    services: source.service,
    tags: source.tags,
    summary,
    actionText,
    keyDates: extractKeyDates(fullText, published, actionRequiredBy, isRetirement),
    actionRequiredBy,
    published,
    lastUpdated: isoDay(source.lastUpdated) || published,
    href: messageHref(source.id),
    learnUrl: firstLearnLink(source.content),
  };
}

/** Action needed first, then major changes, then newest. */
export function compareItems(a: BriefingItem, b: BriefingItem): number {
  if (a.isAction !== b.isAction) return a.isAction ? -1 : 1;
  if (a.isMajor !== b.isMajor) return a.isMajor ? -1 : 1;
  if (a.published !== b.published) return a.published < b.published ? 1 : -1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * In-scope posts first published inside `window`, plus posts re-issued as an
 * "Updated message" inside it, ordered action-needed-first.
 */
export function selectWindowItems(
  sources: BriefingSource[],
  window: DateWindow,
  scope: BriefingScope = 'both'
): BriefingItem[] {
  const items: BriefingItem[] = [];
  for (const source of sources) {
    if (!isInScopeSource(source)) continue;
    let change: 'new' | 'updated' | null = null;
    if (isInWindow(source.published, window)) change = 'new';
    else if (isUpdatedPost(source) && isInWindow(source.lastUpdated, window)) change = 'updated';
    if (!change) continue;

    const item = buildBriefingItem(source, change);
    if (matchesScope(item.product, scope)) items.push(item);
  }
  return items.sort(compareItems);
}

export function buildBriefingModel(
  sources: BriefingSource[],
  weekKey: string,
  scope: BriefingScope = 'both'
): BriefingModel {
  const window = weekWindow(weekKey);
  return {
    weekKey,
    scope,
    windowStart: toIsoDate(window.start),
    windowEnd: toIsoDate(addDays(window.end, -1)),
    items: selectWindowItems(sources, window, scope),
  };
}

// ── Draft and email model ──────────────────────────────────────────────────

export interface BriefingDraft {
  greeting: string;
  intro: string;
  closing: string;
  excludedKeys: string[];
  summaryOverrides: Record<string, string>;
}

export interface EmailItem {
  key: string;
  id: string;
  title: string;
  summary: string;
  actionText: string;
  reasonLabel: string;
  areaLabel: string;
  areaColor: string;
  isMajor: boolean;
  isUpdated: boolean;
  keyDates: { label: string; dateLabel: string }[];
  href: string;
  learnUrl: string;
}

export interface EmailGroup {
  label: string;
  color: string;
  items: EmailItem[];
}

export interface EmailModel {
  headline: string;
  dateLabel: string;
  coverageLabel: string;
  greeting: string;
  intro: string;
  closing: string;
  stats: { label: string; value: string }[];
  actions: EmailItem[];
  groups: EmailGroup[];
  emptyNote: string;
  releasePlan: { features: ReleasePlanFeature[]; note: string; isUnavailable: boolean } | null;
  footerNote: string;
}

const REASON_LABELS: Record<BriefingActionReason, string> = {
  deadline: 'Action required',
  prepare: 'Prepare now',
  retirement: 'Retirement',
};

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

export function scopeLabel(scope: BriefingScope): string {
  return scope === 'both'
    ? `${PRODUCT_LABELS['power-platform']} & ${PRODUCT_LABELS['copilot-studio']}`
    : PRODUCT_LABELS[scope];
}

export function defaultIntro(items: BriefingItem[], scope: BriefingScope): string {
  if (!items.length) {
    return `No new ${scopeLabel(scope)} Message Center announcements this week.`;
  }
  const actionCount = items.filter(item => item.isAction).length;
  const areas = [...new Set(items.map(item => getBriefingArea(item.area).label))].slice(0, 3);
  const parts = [
    `This week brings ${items.length} ${scopeLabel(scope)} Message Center ${plural(items.length, 'announcement')}${
      areas.length ? `, led by updates to ${joinList(areas)}` : ''
    }.`,
  ];
  if (actionCount) {
    parts.push(
      `${actionCount} ${plural(actionCount, 'item needs', 'items need')} your attention first.`
    );
  }
  return parts.join(' ');
}

function joinList(list: string[]): string {
  if (list.length <= 1) return list.join('');
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

export function defaultDraft(model: BriefingModel): BriefingDraft {
  return {
    greeting: 'Hello,',
    intro: defaultIntro(model.items, model.scope),
    closing: 'Best regards,',
    excludedKeys: [],
    summaryOverrides: {},
  };
}

function toEmailItem(item: BriefingItem, draft: BriefingDraft): EmailItem {
  const area = getBriefingArea(item.area);
  return {
    key: item.key,
    id: item.id,
    title: item.cleanTitle || item.title,
    summary: draft.summaryOverrides[item.key] ?? item.summary,
    actionText: item.actionText,
    reasonLabel: item.actionReason ? REASON_LABELS[item.actionReason] : '',
    areaLabel: area.label,
    areaColor: area.color,
    isMajor: item.isMajor,
    isUpdated: item.change === 'updated',
    keyDates: item.keyDates.map(entry => ({
      label: entry.label,
      dateLabel: formatIsoDateLabel(entry.date),
    })),
    href: item.href,
    learnUrl: item.learnUrl,
  };
}

/** Apply the draft's exclusions and edits and group the rest for rendering. */
export function buildEmailModel(
  model: BriefingModel,
  draft: BriefingDraft,
  releasePlan?: ReleasePlanResult
): EmailModel {
  const included = model.items.filter(item => !draft.excludedKeys.includes(item.key));
  const actions = included.filter(item => item.isAction).map(item => toEmailItem(item, draft));
  const rest = included.filter(item => !item.isAction);

  const groups: EmailGroup[] = BRIEFING_AREAS.map(area => ({
    label: area.label,
    color: area.color,
    items: rest.filter(item => item.area === area.key).map(item => toEmailItem(item, draft)),
  })).filter(group => group.items.length > 0);

  const monday = parseIsoDate(model.weekKey);
  const window = weekWindow(model.weekKey);
  return {
    headline: `Weekly ${scopeLabel(model.scope)} briefing`,
    dateLabel: monday ? formatLongDate(monday) : model.weekKey,
    coverageLabel: `Message Center posts ${formatWindowLabel(window)}`,
    greeting: draft.greeting,
    intro: draft.intro,
    closing: draft.closing,
    stats: [
      { label: plural(included.length, 'announcement'), value: String(included.length) },
      { label: 'need action', value: String(actions.length) },
      {
        label: plural(included.filter(i => i.isMajor).length, 'major change'),
        value: String(included.filter(i => i.isMajor).length),
      },
    ],
    actions,
    groups,
    emptyNote: included.length
      ? ''
      : `No ${scopeLabel(model.scope)} Message Center announcements for this week.`,
    releasePlan: releasePlan
      ? {
          features: releasePlan.status === 'ok' ? releasePlan.features : [],
          note: releasePlan.note,
          isUnavailable: releasePlan.status === 'unavailable',
        }
      : null,
    footerNote:
      "Message Center posts vary by tenant; use your tenant's Message Center as the source of truth.",
  };
}
