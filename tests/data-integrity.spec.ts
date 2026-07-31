import { expect, test } from '@playwright/test';
import { getFeedItemId, getFeedTimestamp } from '../src/lib/feed/normalize';
import { isAllowedImageHost, isSsrfHost } from '../src/lib/imageProxySecurity';
import { getLifecycleExpiryStatus, parseLifecycleDate } from '../src/lib/lifecycle';
import { getMsrcImpact, getMsrcSeverity } from '../src/lib/msrc';
import { matchesMessageSearch } from '../src/lib/messageSearch';
import { getFabricRoadmaps, parseFabricRoadmapPayload } from '../src/lib/fabricApi';

test.describe('MSRC CVRF normalization', () => {
  const threats = [
    { Type: 0, Description: { Value: 'Remote Code Execution' } },
    { Type: 1, Description: { Value: 'Exploitation Less Likely' } },
    { Type: 3, Description: { Value: 'Important' } },
  ];

  test('maps numeric CVRF threat types to impact and MSRC severity', () => {
    expect(getMsrcImpact(threats)).toBe('Remote Code Execution');
    expect(getMsrcSeverity(threats)).toBe('Important');
  });

  test('does not mislabel a CVSS number as an MSRC severity', () => {
    expect(getMsrcSeverity([{ Type: 1, Description: { Value: '4.3' } }])).toBe('');
  });
});

test.describe('lifecycle date normalization', () => {
  test('parses date-only values in local calendar time', () => {
    const date = parseLifecycleDate('2026-07-31');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(31);
    expect(date?.getHours()).toBe(0);
  });

  test('does not expire a product on its retirement date', () => {
    const now = new Date(2026, 6, 31, 12);
    expect(
      getLifecycleExpiryStatus(
        {
          endOfSupportDate: null,
          mainStreamEndDate: null,
          extendedEndDate: null,
          retirementDate: '2026-07-31',
        },
        now,
      ),
    ).toBe('expiring-soon');
  });
});

test.describe('feed identity and dates', () => {
  test('preserves both plain and attributed RSS guid values', () => {
    expect(getFeedItemId('stable-id', 'https://example.com/item')).toBe('stable-id');
    expect(getFeedItemId({ '#text': 'attributed-id' }, 'https://example.com/item')).toBe(
      'attributed-id',
    );
  });

  test('sorts malformed feed dates as oldest instead of producing NaN', () => {
    expect(getFeedTimestamp('not-a-date')).toBe(0);
    expect(getFeedTimestamp('2026-07-31T00:00:00Z')).toBeGreaterThan(0);
  });
});

test.describe('image proxy boundaries', () => {
  test('allows Microsoft-controlled image hosts', () => {
    expect(isAllowedImageHost('cdn-dynmedia-1.microsoft.com')).toBe(true);
    expect(isAllowedImageHost('statics.teams.cdn.office.net')).toBe(true);
  });

  test('blocks customer-provisionable CDN and storage domains', () => {
    expect(isAllowedImageHost('attacker.azureedge.net')).toBe(false);
    expect(isAllowedImageHost('attacker.blob.core.windows.net')).toBe(false);
    expect(isAllowedImageHost('example.akamaized.net')).toBe(false);
  });

  test('blocks local and private literal hosts', () => {
    expect(isSsrfHost('localhost')).toBe(true);
    expect(isSsrfHost('127.0.0.1')).toBe(true);
    expect(isSsrfHost('192.168.1.20')).toBe(true);
    expect(isSsrfHost('[::1]')).toBe(true);
  });
});

test.describe('Message Center search', () => {
  const message = {
    id: 'MC123456',
    title: 'Teams meeting policy update',
    service: ['Microsoft Teams'],
    lastUpdated: '2026-07-31T00:00:00Z',
    published: '2026-07-30T00:00:00Z',
    tags: ['Admin impact'],
    content: 'Review the policy before rollout.',
    summary: 'A tenant policy change',
    details: [],
    isMajorChange: true,
    severity: 'normal',
    status: 'active' as const,
  };

  test('matches IDs, services, tags, titles, and content case-insensitively', () => {
    expect(matchesMessageSearch(message, 'mc123')).toBe(true);
    expect(matchesMessageSearch(message, 'TEAMS')).toBe(true);
    expect(matchesMessageSearch(message, 'admin impact')).toBe(true);
    expect(matchesMessageSearch(message, 'meeting policy')).toBe(true);
    expect(matchesMessageSearch(message, 'before rollout')).toBe(true);
    expect(matchesMessageSearch(message, 'unrelated')).toBe(false);
  });
});

test.describe('Fabric roadmap payload resilience', () => {
  test('repairs upstream control characters and invalid markdown escapes inside strings', () => {
    const payload =
      '{"results":[{"ReleaseItemID":"1","FeatureName":"REGEXP\\_LIKE\tpreview","FeatureDescription":"","ReleaseDate":"2026-07","ReleaseType":"Preview","ReleaseStatus":"In development","ProductName":"Fabric"}]}';

    const [item] = parseFabricRoadmapPayload(payload);
    expect(item.FeatureName).toBe('REGEXP_LIKE\tpreview');
  });

  test('still rejects payloads that are not a roadmap response', () => {
    expect(() => parseFabricRoadmapPayload('{"message":"upstream error"}')).toThrow(
      'Fabric roadmap returned an invalid response',
    );
  });

  test('keeps successful product areas when another Fabric source fails', async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const loggedErrors: unknown[][] = [];
    console.error = (...args) => loggedErrors.push(args);
    globalThis.fetch = async input => {
      const url = String(input);
      if (url.endsWith('failed-product')) {
        return new Response('unavailable', { status: 503 });
      }
      return new Response(
        '{"results":[{"ReleaseItemID":"1","FeatureName":"Available","FeatureDescription":"","ReleaseDate":"2026-07","ReleaseType":"Preview","ReleaseStatus":"In development","ProductName":"Fabric"}]}',
        { status: 200 },
      );
    };

    try {
      const result = await getFabricRoadmaps(['working-product', 'failed-product']);
      expect(result.items).toHaveLength(1);
      expect(result.failedProductIds).toEqual(['failed-product']);
      expect(loggedErrors).toHaveLength(1);
    } finally {
      globalThis.fetch = originalFetch;
      console.error = originalConsoleError;
    }
  });
});
