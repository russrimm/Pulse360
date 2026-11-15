/**
 * tests/briefing.spec.ts
 *
 * Weekly Customer Briefing: week keys and 7-day windows, ordering, email HTML
 * escaping (golden file), digest CSV escaping, tenant access denial, snapshot
 * upsert idempotency, and release plan degradation.
 *
 * Refresh the golden file with: UPDATE_GOLDEN=1 pnpm exec playwright test tests/briefing.spec.ts --project=chromium
 * Run: pnpm exec playwright test tests/briefing.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { accessError } from '../src/lib/briefing/access';
import {
  buildDigest,
  csvCell,
  digestToCsv,
  digestToMarkdown,
  parseDigestParams,
} from '../src/lib/briefing/digest';
import { buildEmailHtml, buildEmailText } from '../src/lib/briefing/email';
import {
  buildBriefingModel,
  buildEmailModel,
  defaultDraft,
  selectWindowItems,
  type BriefingSource,
} from '../src/lib/briefing/model';
import {
  RELEASE_PLAN_UNAVAILABLE_NOTE,
  loadReleasePlanSection,
  selectUpcomingFeatures,
} from '../src/lib/briefing/release-plan';
import {
  modelFromSnapshots,
  saveBriefingSnapshots,
  type BriefingSnapshotStore,
  type BriefingSnapshotUpsertArgs,
  type BriefingSnapshotPayload,
} from '../src/lib/briefing/snapshot';
import {
  defaultWeekKey,
  isInWindow,
  resolveWeekKey,
  rollingWindow,
  shiftWeekKey,
  weekKeyFor,
  weekWindow,
} from '../src/lib/briefing/week';
import { resolveTenantAccess } from '../src/lib/tenant-access';

function source(overrides: Partial<BriefingSource> & { id: string }): BriefingSource {
  return {
    title: 'Copilot Studio - Something new',
    service: ['Power Platform'],
    tags: [],
    content: '<p>A new capability is rolling out.</p>',
    summary: '',
    isMajorChange: false,
    severity: 'normal',
    actionRequiredByDateTime: null,
    published: '2026-11-04T09:00:00.000Z',
    lastUpdated: '2026-11-04T09:00:00.000Z',
    ...overrides,
  };
}

const HOSTILE_CONTENT = [
  '<p>How does this affect me?</p>',
  '<p>Admins <b>must</b> review &lt;settings&gt; &amp; policies. <script>alert("xss")</script></p>',
  '<p>What do I need to do to prepare?</p>',
  '<p>Review the guide at <a href="https://learn.microsoft.com/power-platform/admin?a=1&b=2">Learn</a> ' +
    '<a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(2)"></p>',
].join('');

const FIXTURE: BriefingSource[] = [
  source({
    id: 'MC100001',
    title: 'Power Platform admin center - Review <b>"quoted"</b> & \'tricky\' settings',
    content: HOSTILE_CONTENT,
    actionRequiredByDateTime: '2026-12-01T00:00:00.000Z',
    published: '2026-11-03T10:00:00.000Z',
    isMajorChange: true,
  }),
  source({
    id: 'MC100002',
    title: 'Copilot Studio - New agent templates',
    published: '2026-11-05T10:00:00.000Z',
  }),
  source({
    id: 'MC100003',
    title: 'Power Automate - Desktop flow improvements',
    service: ['Power Automate'],
    published: '2026-11-06T10:00:00.000Z',
  }),
  source({ id: 'MC100004', title: 'Exchange Online - Out of scope', service: ['Exchange Online'] }),
];

test.describe('week keys and windows', () => {
  test('weekKeyFor maps every weekday to its Monday and Sunday to the week before', () => {
    expect(weekKeyFor(new Date('2026-11-09T00:00:00Z'))).toBe('2026-11-09'); // Monday
    expect(weekKeyFor(new Date('2026-11-13T23:59:59Z'))).toBe('2026-11-09'); // Friday
    expect(weekKeyFor(new Date('2026-11-15T23:59:59Z'))).toBe('2026-11-09'); // Sunday
    expect(weekKeyFor(new Date('2026-11-16T00:00:00Z'))).toBe('2026-11-16'); // next Monday
  });

  test('week keys use UTC, not the local day', () => {
    // 23:30 on Sunday in UTC-5 is already Monday 04:30 UTC.
    expect(weekKeyFor(new Date('2026-11-15T23:30:00-05:00'))).toBe('2026-11-16');
  });

  test('weekends default to the coming Monday, other days to this Monday', () => {
    expect(defaultWeekKey(new Date('2026-11-13T12:00:00Z'))).toBe('2026-11-09');
    expect(defaultWeekKey(new Date('2026-11-14T12:00:00Z'))).toBe('2026-11-16');
    expect(defaultWeekKey(new Date('2026-11-15T12:00:00Z'))).toBe('2026-11-16');
    expect(defaultWeekKey(new Date('2026-11-16T00:00:00Z'))).toBe('2026-11-16');
  });

  test('resolveWeekKey normalizes valid dates and falls back on garbage', () => {
    const now = new Date('2026-11-13T12:00:00Z');
    expect(resolveWeekKey('2026-11-12', now)).toBe('2026-11-09');
    expect(resolveWeekKey('2026-02-30', now)).toBe('2026-11-09');
    expect(resolveWeekKey('nope', now)).toBe('2026-11-09');
    expect(shiftWeekKey('2026-11-09', -1)).toBe('2026-11-02');
    expect(shiftWeekKey('2026-11-09', 1)).toBe('2026-11-16');
  });

  test('the weekly window is [Monday - 7 days, Monday) with an exclusive end', () => {
    const window = weekWindow('2026-11-09');
    expect(window.start.toISOString()).toBe('2026-11-02T00:00:00.000Z');
    expect(window.end.toISOString()).toBe('2026-11-09T00:00:00.000Z');
    expect(isInWindow('2026-11-02T00:00:00.000Z', window)).toBe(true);
    expect(isInWindow('2026-11-01T23:59:59.999Z', window)).toBe(false);
    expect(isInWindow('2026-11-08T23:59:59.999Z', window)).toBe(true);
    expect(isInWindow('2026-11-09T00:00:00.000Z', window)).toBe(false);
  });

  test('the rolling 7-day window includes "now" and excludes anything older than 7 days', () => {
    const now = new Date('2026-11-13T12:00:00.000Z');
    const window = rollingWindow(now, 7);
    expect(isInWindow('2026-11-06T12:00:00.000Z', window)).toBe(true);
    expect(isInWindow('2026-11-06T11:59:59.999Z', window)).toBe(false);
    expect(isInWindow(now, window)).toBe(true);
    expect(isInWindow('2026-11-13T12:00:00.001Z', window)).toBe(false);
  });
});

test.describe('briefing model', () => {
  test('puts action-needed items first, then major changes, then newest', () => {
    const model = buildBriefingModel(FIXTURE, '2026-11-09', 'both');
    expect(model.items.map(item => item.id)).toEqual(['MC100001', 'MC100003', 'MC100002']);
    expect(model.items[0].isAction).toBe(true);
    expect(model.items[0].actionReason).toBe('deadline');
  });

  test('scope filters by product and out-of-scope posts never appear', () => {
    const studio = buildBriefingModel(FIXTURE, '2026-11-09', 'copilot-studio');
    expect(studio.items.map(item => item.id)).toEqual(['MC100002']);
    const platform = buildBriefingModel(FIXTURE, '2026-11-09', 'power-platform');
    expect(platform.items.map(item => item.id)).toEqual(['MC100001', 'MC100003']);
  });

  test('includes re-issued "Updated message" posts but not silent edits', () => {
    const window = weekWindow('2026-11-09');
    const updated = source({
      id: 'MC200001',
      title: '[Updated] Copilot Studio - Revised',
      tags: ['Updated message'],
      published: '2026-09-01T00:00:00.000Z',
      lastUpdated: '2026-11-05T00:00:00.000Z',
    });
    const silentEdit = source({
      id: 'MC200002',
      published: '2026-09-01T00:00:00.000Z',
      lastUpdated: '2026-11-05T00:00:00.000Z',
    });
    const items = selectWindowItems([updated, silentEdit], window);
    expect(items.map(item => [item.id, item.change])).toEqual([['MC200001', 'updated']]);
  });

  test('sanitizes Message Center HTML before text, summaries, and links are derived', () => {
    const [item] = buildBriefingModel([FIXTURE[0]], '2026-11-09', 'both').items;
    const derived = JSON.stringify(item);
    expect(derived).not.toContain('alert(');
    expect(derived).not.toContain('javascript:');
    expect(derived).not.toContain('onerror');
    expect(item.learnUrl).toBe('https://learn.microsoft.com/power-platform/admin?a=1&b=2');
  });
});

test.describe('email rendering', () => {
  const model = buildBriefingModel(FIXTURE, '2026-11-09', 'both');
  const email = buildEmailModel(model, defaultDraft(model), {
    status: 'unavailable',
    note: RELEASE_PLAN_UNAVAILABLE_NOTE,
  });
  const html = buildEmailHtml(email);

  test('escapes hostile content and keeps only https links', () => {
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(html).not.toMatch(/href="(?!https:\/\/)/);
    expect(html).toContain('&lt;b&gt;&quot;quoted&quot;&lt;/b&gt; &amp; &#39;tricky&#39; settings');
    expect(html).not.toContain('<style');
  });

  test('draft edits are escaped too', () => {
    const edited = buildEmailHtml(
      buildEmailModel(model, {
        ...defaultDraft(model),
        intro: '<img src=x onerror=alert(1)>\n\nSecond "para"',
      })
    );
    expect(edited).not.toContain('<img');
    expect(edited).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(edited).toContain('Second &quot;para&quot;');
  });

  test('excluded items and summary edits flow into the email', () => {
    const draft = {
      ...defaultDraft(model),
      excludedKeys: ['mc:MC100002'],
      summaryOverrides: { 'mc:MC100003': 'Edited summary' },
    };
    const edited = buildEmailHtml(buildEmailModel(model, draft));
    expect(edited).not.toContain('MC100002');
    expect(edited).toContain('Edited summary');
  });

  test('plain text lists action items first and states the release plan source is unavailable', () => {
    const text = buildEmailText(email);
    expect(text.indexOf('ACTION REQUIRED')).toBeGreaterThan(-1);
    expect(text.indexOf('ACTION REQUIRED')).toBeLessThan(text.indexOf('NEW IN MESSAGE CENTER'));
    expect(text).toContain(RELEASE_PLAN_UNAVAILABLE_NOTE);
  });

  test('matches the golden Outlook HTML', () => {
    const goldenPath = join(__dirname, 'fixtures', 'briefing-email.golden.html');
    if (process.env.UPDATE_GOLDEN === '1' || !existsSync(goldenPath)) {
      writeFileSync(goldenPath, html);
    }
    expect(html).toBe(readFileSync(goldenPath, 'utf8'));
  });
});

test.describe('digest export', () => {
  test('csvCell quotes fields and neutralizes spreadsheet formulas', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
    for (const prefix of ['=', '+', '-', '@']) {
      expect(csvCell(`${prefix}1+1`)).toBe(`'${prefix}1+1`);
    }
    expect(csvCell('\t=1+1')).toBe("'\t=1+1");
    expect(csvCell('  =1+1')).toBe("'  =1+1");
    expect(csvCell('2026-11-05')).toBe('2026-11-05');
  });

  test('digest rows are in-window, in-scope, action-first, and formula-safe', () => {
    const now = new Date('2026-11-07T12:00:00.000Z');
    const sources = [
      ...FIXTURE,
      source({
        id: 'MC300001',
        title: '=cmd|calc Power Platform',
        published: '2026-11-06T00:00:00.000Z',
      }),
      source({
        id: 'MC300002',
        published: '2026-10-01T00:00:00.000Z',
        lastUpdated: '2026-10-01T00:00:00.000Z',
      }),
    ];
    const digest = buildDigest(sources, now, 7);
    expect(digest.items.map(item => item.id)).toEqual([
      'MC100001',
      'MC100003',
      'MC300001',
      'MC100002',
    ]);
    expect(digest.items.some(item => item.id === 'MC300002')).toBe(false);
    expect(digest.items.some(item => item.id === 'MC100004')).toBe(false);

    const csv = digestToCsv(digest);
    expect(csv.startsWith('\uFEFFID,Title,')).toBe(true);
    const row = csv.split('\r\n').find(line => line.startsWith('MC300001'))!;
    expect(row).toContain(",'=cmd|calc Power Platform,");
    expect(digestToMarkdown(digest)).not.toContain('<script');
  });

  test('parseDigestParams defaults to 7 days of CSV and rejects bad input', () => {
    expect(parseDigestParams(new URLSearchParams(''))).toEqual({
      ok: true,
      days: 7,
      format: 'csv',
    });
    expect(parseDigestParams(new URLSearchParams('days=30&format=MD'))).toEqual({
      ok: true,
      days: 30,
      format: 'md',
    });
    for (const query of ['days=0', 'days=91', 'days=abc', 'days=1.5', 'format=xml']) {
      expect(parseDigestParams(new URLSearchParams(query)).ok).toBe(false);
    }
  });
});

test.describe('tenant access', () => {
  test('anonymous callers are denied when sign-in is configured, and misconfiguration fails closed', () => {
    const anonymous = resolveTenantAccess({
      publicMode: 'unset',
      isAuthConfigured: true,
      hasAuthenticatedUser: false,
    });
    expect(accessError(anonymous)).toEqual({ status: 401, error: 'Authentication required' });

    const optedOut = resolveTenantAccess({
      publicMode: 'disabled',
      isAuthConfigured: false,
      hasAuthenticatedUser: false,
    });
    expect(accessError(optedOut)?.status).toBe(503);

    const signedIn = resolveTenantAccess({
      publicMode: 'unset',
      isAuthConfigured: true,
      hasAuthenticatedUser: true,
    });
    expect(accessError(signedIn)).toBeNull();
  });
});

test.describe('snapshots', () => {
  function memoryStore() {
    const rows = new Map<string, BriefingSnapshotPayload>();
    const calls: BriefingSnapshotUpsertArgs[] = [];
    const store: BriefingSnapshotStore = {
      async upsert(args) {
        calls.push(args);
        const { weekKey, product } = args.where.weekKey_product;
        const key = `${weekKey}|${product}`;
        rows.set(key, rows.has(key) ? args.update.payload : args.create.payload);
      },
    };
    return { rows, calls, store };
  }

  test('upserting the same week twice keeps one row per product and refreshes the payload', async () => {
    const { rows, store } = memoryStore();
    await saveBriefingSnapshots(store, FIXTURE, '2026-11-09', new Date('2026-11-09T12:00:00Z'));
    expect([...rows.keys()].sort()).toEqual([
      '2026-11-09|copilot-studio',
      '2026-11-09|power-platform',
    ]);

    const more = [
      ...FIXTURE,
      source({
        id: 'MC100005',
        title: 'Copilot Studio - Late',
        published: '2026-11-08T00:00:00.000Z',
      }),
    ];
    await saveBriefingSnapshots(store, more, '2026-11-09', new Date('2026-11-09T12:05:00Z'));
    expect(rows.size).toBe(2);
    expect(rows.get('2026-11-09|copilot-studio')!.items.map(item => item.id)).toContain('MC100005');
    expect(rows.get('2026-11-09|copilot-studio')!.generatedAt).toBe('2026-11-09T12:05:00.000Z');
  });

  test('an unchanged re-run writes identical content', async () => {
    const first = memoryStore();
    const when = new Date('2026-11-09T12:00:00Z');
    await saveBriefingSnapshots(first.store, FIXTURE, '2026-11-09', when);
    const before = JSON.stringify([...first.rows.entries()]);
    await saveBriefingSnapshots(first.store, FIXTURE, '2026-11-09', when);
    expect(JSON.stringify([...first.rows.entries()])).toBe(before);
  });

  test('past weeks rebuild from snapshots only when every product in scope has one', async () => {
    const { rows, store } = memoryStore();
    await saveBriefingSnapshots(store, FIXTURE, '2026-11-09', new Date('2026-11-09T12:00:00Z'));
    const snapshots = [...rows.values()];

    const both = modelFromSnapshots('2026-11-09', 'both', snapshots);
    expect(both?.items.map(item => item.id)).toEqual(['MC100001', 'MC100003', 'MC100002']);
    expect(modelFromSnapshots('2026-11-09', 'copilot-studio', snapshots.slice(0, 1))).toBeNull();
    expect(modelFromSnapshots('2026-11-16', 'both', snapshots)).toBeNull();
  });
});

test.describe('release plan section', () => {
  test('degrades to an unavailable note when the provider is empty or throws', async () => {
    const empty = await loadReleasePlanSection(
      { name: 'empty', getReleasePlans: async () => [] },
      '2026-11-09',
      'both'
    );
    expect(empty).toEqual({ status: 'unavailable', note: RELEASE_PLAN_UNAVAILABLE_NOTE });

    const failing = await loadReleasePlanSection(
      {
        name: 'failing',
        getReleasePlans: async () => {
          throw new Error('boom');
        },
      },
      '2026-11-09',
      'both'
    );
    expect(failing.status).toBe('unavailable');
  });

  test('selects upcoming Power Platform and Copilot Studio features by scope and date', async () => {
    const records = [
      { id: '1', title: 'Studio GA', product: 'Microsoft Copilot Studio', gaDate: '2026-12-01' },
      { id: '2', title: 'Apps preview', product: 'Power Apps', publicPreviewDate: '2026-11-20' },
      { id: '3', title: 'Too far', product: 'Power Apps', gaDate: '2027-06-01' },
      { id: '4', title: 'Other product', product: 'Dynamics 365 Sales', gaDate: '2026-12-01' },
    ];
    expect(selectUpcomingFeatures(records, '2026-11-09', 'both').map(f => f.id)).toEqual([
      '2',
      '1',
    ]);
    expect(selectUpcomingFeatures(records, '2026-11-09', 'copilot-studio').map(f => f.id)).toEqual([
      '1',
    ]);

    const result = await loadReleasePlanSection(
      { name: 'fake', getReleasePlans: async () => records },
      '2026-11-09',
      'both'
    );
    expect(result.status).toBe('ok');
  });
});
