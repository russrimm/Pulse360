/**
 * tests/service-health.spec.ts
 *
 * Provider-neutral health logic and the Microsoft Graph Service Health client,
 * exercised with an injected fetch so no network or credentials are needed.
 *
 * Run: pnpm exec playwright test tests/service-health.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

import { describeHealthError, HealthError } from '../src/lib/health/errors';
import {
  fetchM365Health,
  fetchM365Issue,
  normalizeGraphIssue,
  resolveNextLink,
} from '../src/lib/health/graph-health';
import { HEALTH_FACET_KEYS, healthListConfig, summarizeHealth } from '../src/lib/health/query';
import {
  isEventActive,
  isValidHealthIssueId,
  levelFromStatus,
  severityFor,
  statusLabel,
} from '../src/lib/health/status';
import { parseListParams, queryList } from '../src/lib/list-query';

const NOW = Date.parse('2026-11-13T12:00:00Z');
const DIRECT_ENV = {
  AZURE_CLIENT_ID: 'client-id',
  AZURE_TENANT_ID: 'tenant-id',
  AZURE_CLIENT_SECRET: 'secret',
};
const APIM_ENV = { AZURE_API_URL: 'https://apim.example.net/graph' };

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

function overview(service: string, status: string) {
  return { id: service, service, status };
}

function issue(overrides: Record<string, unknown> = {}) {
  return {
    id: 'EX100',
    title: 'Users cannot send mail',
    service: 'Exchange Online',
    feature: 'E-Mail and calendar access',
    featureGroup: 'Email',
    classification: 'incident',
    status: 'serviceInterruption',
    isResolved: false,
    startDateTime: '2026-11-12T10:00:00Z',
    lastModifiedDateTime: '2026-11-13T09:00:00Z',
    endDateTime: null,
    impactDescription: 'Affected users cannot send mail.',
    origin: 'microsoft',
    details: [{ name: 'Root cause', value: 'Bad deployment' }],
    posts: [
      {
        createdDateTime: '2026-11-12T11:00:00Z',
        postType: 'regular',
        description: { contentType: 'html', content: '<p>Investigating</p>' },
      },
      {
        createdDateTime: '2026-11-12T10:30:00Z',
        postType: 'regular',
        description: { contentType: 'text', content: 'First update' },
      },
    ],
    ...overrides,
  };
}

interface Call {
  url: string;
  authorization: string | undefined;
}

function recordingFetch(handler: (url: string, call: number) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = init?.headers as Record<string, string> | undefined;
    calls.push({ url, authorization: headers?.Authorization });
    return handler(url, calls.length);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

const noSleep = async () => {};
const getToken = async () => 'test-token';

test.describe('status mapping', () => {
  test('maps Graph statuses to levels, labels and severity', () => {
    expect(levelFromStatus('serviceOperational')).toBe('operational');
    expect(levelFromStatus('serviceRestored')).toBe('operational');
    expect(levelFromStatus('serviceDegradation')).toBe('degraded');
    expect(levelFromStatus('serviceInterruption')).toBe('interruption');
    expect(levelFromStatus('extendedRecovery')).toBe('extended');
    expect(levelFromStatus('restoringService')).toBe('restoring');
    expect(levelFromStatus('somethingNew')).toBe('unknown');
    expect(statusLabel('serviceDegradation')).toBe('Service degradation');
    expect(statusLabel('brandNewStatus')).toBe('Brand new status');

    expect(severityFor('interruption', 'incident', true)).toBe('critical');
    expect(severityFor('degraded', 'advisory', true)).toBe('warning');
    expect(severityFor('unknown', 'advisory', true)).toBe('informational');
    expect(severityFor('interruption', 'incident', false)).toBe('informational');
  });

  test('a resolved-family status is inactive even without an end date', () => {
    expect(isEventActive({ status: 'serviceRestored', isResolved: false, endedAt: null })).toBe(false);
    expect(isEventActive({ status: 'investigating', isResolved: true, endedAt: null })).toBe(false);
    expect(isEventActive({ status: 'investigating', isResolved: false, endedAt: '2026-11-13T00:00:00Z' })).toBe(false);
    expect(isEventActive({ status: 'investigating', isResolved: false, endedAt: null })).toBe(true);
  });

  test('validates issue IDs before they reach a URL', () => {
    expect(isValidHealthIssueId('EX123456')).toBe(true);
    expect(isValidHealthIssueId('../etc')).toBe(false);
    expect(isValidHealthIssueId("x' or 1 eq 1")).toBe(false);
    expect(isValidHealthIssueId('')).toBe(false);
  });
});

test.describe('Graph client', () => {
  test('loads, normalizes and orders services and issues across pages', async () => {
    const { fetchImpl, calls } = recordingFetch(url => {
      if (url.includes('/healthOverviews')) {
        return json({
          value: [
            overview('Microsoft Teams', 'serviceOperational'),
            overview('Exchange Online', 'serviceInterruption'),
            overview('SharePoint Online', 'serviceDegradation'),
          ],
        });
      }
      if (url.includes('page=2')) {
        return json({
          value: [
            issue({
              id: 'TM200',
              service: 'Microsoft Teams',
              status: 'serviceRestored',
              classification: 'advisory',
              lastModifiedDateTime: '2026-11-10T09:00:00Z',
            }),
          ],
        });
      }
      return json({
        value: [issue()],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues?page=2',
      });
    });

    const snapshot = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep, now: () => NOW });

    expect(snapshot.sections).toEqual({ services: 'ok', events: 'ok' });
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.services.map(service => service.name)).toEqual([
      'Exchange Online',
      'SharePoint Online',
      'Microsoft Teams',
    ]);
    expect(snapshot.services[0]).toMatchObject({ level: 'interruption', activeEventCount: 1 });

    expect(snapshot.events.map(event => event.id)).toEqual(['EX100', 'TM200']);
    const [active, resolved] = snapshot.events;
    expect(active).toMatchObject({ isActive: true, severity: 'critical', classification: 'incident' });
    expect(resolved).toMatchObject({ isActive: false, severity: 'informational', classification: 'advisory' });
    expect(active.posts.map(post => post.contentType)).toEqual(['text', 'html']);
    expect(active.details).toEqual([{ name: 'Root cause', value: 'Bad deployment' }]);

    const issuesCall = calls.find(call => call.url.includes('/issues?%24') || call.url.includes('/issues?$'));
    expect(issuesCall?.url).toContain('startDateTime%20gt%202026-10-14');
    expect(calls.every(call => call.authorization === 'Bearer test-token')).toBe(true);
  });

  test('a 403 surfaces as forbidden naming the required permission', async () => {
    const { fetchImpl } = recordingFetch(() => json({ error: { code: 'UnknownError' } }, { status: 403 }));
    const failure = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep }).catch(e => e);

    expect(failure).toBeInstanceOf(HealthError);
    expect(failure.kind).toBe('forbidden');
    expect(describeHealthError(failure.kind).body).toContain('ServiceHealth.Read.All');
  });

  test('retries 429 using Retry-After, then succeeds', async () => {
    const sleeps: number[] = [];
    const { fetchImpl, calls } = recordingFetch((url, call) => {
      if (call === 1) return new Response('', { status: 429, headers: { 'Retry-After': '2' } });
      return json({ value: url.includes('/healthOverviews') ? [overview('Exchange Online', 'serviceOperational')] : [] });
    });

    const snapshot = await fetchM365Health({
      env: DIRECT_ENV,
      fetchImpl,
      getToken,
      sleep: async ms => void sleeps.push(ms),
      now: () => NOW,
    });

    expect(sleeps[0]).toBe(2000);
    expect(calls.length).toBeGreaterThan(2);
    expect(snapshot.services).toHaveLength(1);
  });

  test('persistent throttling is reported as throttled, not as empty data', async () => {
    const { fetchImpl } = recordingFetch(() => new Response('', { status: 429 }));
    const failure = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep }).catch(e => e);
    expect(failure).toMatchObject({ kind: 'throttled' });
  });

  test('failed issue history is "unavailable", never "no issues" or "healthy"', async () => {
    const { fetchImpl } = recordingFetch(url =>
      url.includes('/healthOverviews')
        ? json({ value: [overview('Exchange Online', 'serviceOperational')] })
        : new Response('', { status: 500 })
    );
    const snapshot = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep, now: () => NOW });

    expect(snapshot.sections).toEqual({ services: 'ok', events: 'unavailable' });
    expect(snapshot.events).toEqual([]);
    expect(snapshot.warnings.join(' ')).toMatch(/issue history/i);
    expect(summarizeHealth(snapshot).headline).toBe('unknown');
  });

  test('failed service status keeps issues but never claims health', async () => {
    const { fetchImpl } = recordingFetch(url =>
      url.includes('/healthOverviews') ? new Response('', { status: 503 }) : json({ value: [issue()] })
    );
    const snapshot = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep, now: () => NOW });

    expect(snapshot.sections).toEqual({ services: 'unavailable', events: 'ok' });
    expect(snapshot.services).toEqual([]);
    expect(summarizeHealth(snapshot).headline).toBe('impact');
  });

  test('both sources failing throws instead of returning an empty snapshot', async () => {
    const { fetchImpl } = recordingFetch(() => new Response('', { status: 500 }));
    const failure = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep }).catch(e => e);
    expect(failure).toMatchObject({ kind: 'unavailable' });
  });

  test('a later page failing yields partial data with a warning', async () => {
    const { fetchImpl } = recordingFetch(url => {
      if (url.includes('/healthOverviews')) return json({ value: [overview('Exchange Online', 'serviceOperational')] });
      if (url.includes('page=2')) return new Response('', { status: 400 });
      return json({
        value: [issue()],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues?page=2',
      });
    });
    const snapshot = await fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep, now: () => NOW });

    expect(snapshot.sections.events).toBe('partial');
    expect(snapshot.events).toHaveLength(1);
    expect(snapshot.warnings.join(' ')).toMatch(/partial/i);
  });

  test('without credentials it reports not-configured and never calls Graph', async () => {
    const { fetchImpl, calls } = recordingFetch(() => json({ value: [] }));
    const failure = await fetchM365Health({ env: {}, fetchImpl, getToken }).catch(e => e);
    expect(failure).toMatchObject({ kind: 'not-configured' });
    expect(calls).toHaveLength(0);
  });

  test('APIM mode sends no bearer token and keeps pagination on the gateway', async () => {
    let tokenRequests = 0;
    const { fetchImpl, calls } = recordingFetch(url => {
      if (url.includes('/healthOverviews')) return json({ value: [] });
      if (url.includes('page=2')) return json({ value: [] });
      return json({
        value: [issue()],
        '@odata.nextLink': 'https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues?page=2',
      });
    });

    await fetchM365Health({
      env: APIM_ENV,
      fetchImpl,
      getToken: async () => {
        tokenRequests++;
        return 'unused';
      },
      sleep: noSleep,
      now: () => NOW,
    });

    expect(tokenRequests).toBe(0);
    expect(calls.every(call => call.authorization === undefined)).toBe(true);
    expect(calls.every(call => call.url.startsWith('https://apim.example.net/graph/v1.0/'))).toBe(true);
  });

  test('refuses to follow pagination to an unrelated host with a bearer token', () => {
    const base = 'https://graph.microsoft.com';
    expect(resolveNextLink('https://graph.microsoft.com/v1.0/x?page=2', base)).toBe(
      'https://graph.microsoft.com/v1.0/x?page=2'
    );
    expect(resolveNextLink('https://evil.example.com/v1.0/x', base)).toBeNull();
    expect(resolveNextLink('not a url', base)).toBeNull();
    expect(resolveNextLink('https://graph.microsoft.com/v1.0/x?page=2', 'https://apim.example.net/graph')).toBe(
      'https://apim.example.net/graph/v1.0/x?page=2'
    );
  });

  test('fetchM365Issue returns null on 404 and encodes the ID', async () => {
    const { fetchImpl, calls } = recordingFetch(() => new Response('', { status: 404 }));
    const result = await fetchM365Issue('EX404', { env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep });
    expect(result).toBeNull();
    expect(calls[0].url).toBe('https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/issues/EX404');
  });

  test('normalization drops entries without an ID and tolerates missing fields', () => {
    expect(normalizeGraphIssue({ title: 'no id' })).toBeNull();
    expect(normalizeGraphIssue(null)).toBeNull();
    const minimal = normalizeGraphIssue({ id: 'MO1' });
    expect(minimal).toMatchObject({ id: 'MO1', title: 'MO1', service: 'Unknown service', posts: [] });
  });
});

test.describe('listing and summary', () => {
  async function snapshot() {
    const { fetchImpl } = recordingFetch(url =>
      url.includes('/healthOverviews')
        ? json({ value: [overview('Exchange Online', 'serviceInterruption'), overview('Microsoft Teams', 'serviceOperational')] })
        : json({
            value: [
              issue(),
              issue({ id: 'TM1', title: 'Teams calls are delayed', impactDescription: 'Call setup is slow.', service: 'Microsoft Teams', classification: 'advisory', status: 'serviceDegradation' }),
              issue({ id: 'TM2', title: 'Teams chat latency', impactDescription: 'Messages arrive late.', service: 'Microsoft Teams', status: 'serviceRestored', lastModifiedDateTime: '2026-11-01T00:00:00Z' }),
            ],
          })
    );
    return fetchM365Health({ env: DIRECT_ENV, fetchImpl, getToken, sleep: noSleep, now: () => NOW });
  }

  test('filters by service, severity, classification and status via URL params', async () => {
    const { events } = await snapshot();
    const run = (raw: Record<string, string | string[]>) =>
      queryList(events, parseListParams(raw, [...HEALTH_FACET_KEYS]), healthListConfig, NOW);

    expect(run({}).filteredCount).toBe(3);
    expect(run({ service: 'Microsoft Teams' }).items.map(event => event.id)).toEqual(['TM1', 'TM2']);
    expect(run({ severity: 'Critical' }).items.map(event => event.id)).toEqual(['EX100']);
    expect(run({ classification: 'Advisory' }).items.map(event => event.id)).toEqual(['TM1']);
    expect(run({ status: 'Service restored' }).items.map(event => event.id)).toEqual(['TM2']);
    expect(run({ date: 'last7' }).items.map(event => event.id)).not.toContain('TM2');
    expect(run({ q: 'delayed' }).items.map(event => event.id)).toEqual(['TM1']);
    expect(run({ q: 'cannot send' }).items.map(event => event.id)).toEqual(['EX100']);
  });

  test('active issues sort before resolved ones', async () => {
    const { events } = await snapshot();
    const ordered = queryList(events, parseListParams({}, [...HEALTH_FACET_KEYS]), healthListConfig, NOW).items;
    expect(ordered.map(event => event.isActive)).toEqual([true, true, false]);
  });

  test('headline is healthy only when everything loaded and nothing is active', async () => {
    const base = await snapshot();
    expect(summarizeHealth(base).headline).toBe('impact');

    const calm = {
      ...base,
      services: base.services.map(service => ({ ...service, level: 'operational' as const })),
      events: base.events.filter(event => !event.isActive),
    };
    expect(summarizeHealth(calm).headline).toBe('healthy');
    expect(summarizeHealth({ ...calm, sections: { services: 'ok', events: 'partial' } }).headline).toBe('unknown');
    expect(summarizeHealth({ ...calm, services: [] }).headline).toBe('unknown');
  });
});
