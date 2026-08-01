import { expect, test } from '@playwright/test';
import {
  decodeHtmlEntities,
  getFeedItemId,
  getFeedTimestamp,
  normalizeFeedItems,
} from '../src/lib/feed/normalize';
import { isAllowedImageHost, isSsrfHost } from '../src/lib/imageProxySecurity';
import { getLifecycleExpiryStatus, parseLifecycleDate } from '../src/lib/lifecycle';
import { getMsrcImpact, getMsrcSeverity } from '../src/lib/msrc';
import { matchesMessageSearch } from '../src/lib/messageSearch';
import { getFabricRoadmaps, parseFabricRoadmapPayload } from '../src/lib/fabricApi';
import { buildDetailMetadata, buildMissingDetailMetadata } from '../src/lib/detailMetadata';
import { normalizeFeedText } from '../src/lib/feed/text';
import { parseGraphDate } from '../src/lib/graph';
import { readBoundedResponseText } from '../src/lib/feed/response';
import { formatCalendarDate, parseCalendarDate } from '../src/lib/date';
import { resolveMessageCenterAccess } from '../src/lib/message-center-access';

test.describe('Message Center access policy', () => {
  test('fails closed in development when authentication is unconfigured', () => {
    const previousNodeEnv = Object.getOwnPropertyDescriptor(process.env, 'NODE_ENV');
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      enumerable: true,
      value: 'development',
      writable: true,
    });

    try {
      expect(
        resolveMessageCenterAccess({
          isPublic: false,
          isAuthConfigured: false,
          hasAuthenticatedUser: false,
        }),
      ).toBe('unconfigured');
    } finally {
      if (previousNodeEnv) {
        Object.defineProperty(process.env, 'NODE_ENV', previousNodeEnv);
      } else {
        Reflect.deleteProperty(process.env, 'NODE_ENV');
      }
    }
  });

  test('allows only explicit publication or an authenticated user', () => {
    expect(
      resolveMessageCenterAccess({
        isPublic: true,
        isAuthConfigured: false,
        hasAuthenticatedUser: false,
      }),
    ).toBe('allowed');
    expect(
      resolveMessageCenterAccess({
        isPublic: false,
        isAuthConfigured: true,
        hasAuthenticatedUser: false,
      }),
    ).toBe('authentication-required');
    expect(
      resolveMessageCenterAccess({
        isPublic: false,
        isAuthConfigured: true,
        hasAuthenticatedUser: true,
      }),
    ).toBe('allowed');
  });
});

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

  test('accepts numeric threat types serialized as strings', () => {
    const stringThreats = [
      { Type: '0', Description: { Value: 'Elevation of Privilege' } },
      { Type: '3', Description: { Value: 'Critical' } },
    ];
    expect(getMsrcImpact(stringThreats)).toBe('Elevation of Privilege');
    expect(getMsrcSeverity(stringThreats)).toBe('Critical');
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
        now
      )
    ).toBe('expiring-soon');
  });

  test('treats month-only release dates as local calendar dates', () => {
    const date = parseCalendarDate('2026-07');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(1);
    expect(formatCalendarDate('2026-07')).toBe('Jul 1, 2026');
  });
});

test.describe('feed identity and dates', () => {
  test('preserves both plain and attributed RSS guid values', () => {
    expect(getFeedItemId('stable-id', 'https://example.com/item')).toBe('stable-id');
    expect(getFeedItemId({ '#text': 'attributed-id' }, 'https://example.com/item')).toBe(
      'attributed-id'
    );
  });

  test('sorts malformed feed dates as oldest instead of producing NaN', () => {
    expect(getFeedTimestamp('not-a-date')).toBe(0);
    expect(getFeedTimestamp('2026-07-31T00:00:00Z')).toBeGreaterThan(0);
  });

  test('normalizes single-item RSS payloads without dropping the item', () => {
    const item = { title: 'Only item' };
    expect(normalizeFeedItems(item)).toEqual([item]);
    expect(normalizeFeedItems([item])).toEqual([item]);
    expect(normalizeFeedItems(undefined)).toEqual([]);
  });

  test('decodes named, decimal, and hexadecimal feed entities without a DOM effect', () => {
    expect(decodeHtmlEntities('R&amp;D &#8212; &#x1F680;')).toBe('R&D — 🚀');
    expect(normalizeFeedText('<p>AI &mdash; caf&eacute; &amp; cloud</p>')).toBe(
      'AI — café & cloud'
    );
  });
});

test.describe('feed response limits', () => {
  test('cancels known oversized response bodies before rejecting them', async () => {
    let wasCancelled = false;
    const response = new Response(
      new ReadableStream({
        cancel() {
          wasCancelled = true;
        },
      }),
      { headers: { 'content-length': '6' } }
    );

    await expect(readBoundedResponseText(response, 5)).rejects.toThrow(
      'Microsoft feed response exceeds the size limit'
    );
    expect(wasCancelled).toBe(true);
  });

  test('rejects chunked bodies as soon as they exceed the byte limit', async () => {
    const encoder = new TextEncoder();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('123'));
          controller.enqueue(encoder.encode('456'));
          controller.close();
        },
      })
    );

    await expect(readBoundedResponseText(response, 5)).rejects.toThrow(
      'Microsoft feed response exceeds the size limit'
    );
  });
});

test.describe('detail metadata', () => {
  test('creates canonical, social, and HTML-free metadata with bounded descriptions', () => {
    const metadata = buildDetailMetadata({
      title: 'Update &amp; rollout',
      description: `<p>${'A'.repeat(170)}</p>`,
      canonicalPath: '/message/MC123',
    });

    expect(metadata.title).toBe('Update & rollout | Pulse 360');
    expect(metadata.description).not.toContain('<p>');
    expect(String(metadata.description)).toHaveLength(160);
    expect(metadata.alternates).toEqual({ canonical: '/message/MC123' });
    expect(metadata.openGraph).toMatchObject({ type: 'article', url: '/message/MC123' });
  });

  test('marks missing detail metadata as non-indexable', () => {
    expect(buildMissingDetailMetadata('Message')).toMatchObject({
      title: 'Message not found | Pulse 360',
      robots: { index: false, follow: false },
    });
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
      'Fabric roadmap returned an invalid response'
    );
  });

  test('preserves escaped quotes while repairing later control characters', () => {
    const payload =
      '{"results":[{"ReleaseItemID":"1","FeatureName":"Say \\"hello\\"","FeatureDescription":"Line\tbreak","ReleaseDate":"2026-07","ReleaseType":"Preview","ReleaseStatus":"In development","ProductName":"Fabric"}]}';

    const [item] = parseFabricRoadmapPayload(payload);
    expect(item.FeatureName).toBe('Say "hello"');
    expect(item.FeatureDescription).toBe('Line\tbreak');
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
        { status: 200 }
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

test.describe('Graph date normalization', () => {
  test('drops malformed optional dates before persistence', () => {
    expect(parseGraphDate('not-a-date')).toBeNull();
    expect(parseGraphDate(null)).toBeNull();
    expect(parseGraphDate('2026-07-31T12:00:00Z')?.toISOString()).toBe('2026-07-31T12:00:00.000Z');
  });
});
