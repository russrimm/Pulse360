import 'server-only';
import { NextResponse } from 'next/server';
import { readBoundedResponseText } from './response';

export const FEED_RESPONSE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  'Content-Type': 'application/xml; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
} as const;

export async function fetchMicrosoftFeed(url: string, revalidateSeconds = 3600): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; Pulse360/1.0; +https://github.com/russrimm/Pulse360)',
    },
    next: { revalidate: revalidateSeconds },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });
}

export async function readMicrosoftFeedBody(response: Response): Promise<string> {
  return readBoundedResponseText(response);
}

export async function proxyMicrosoftFeed(url: string): Promise<NextResponse> {
  const response = await fetchMicrosoftFeed(url);
  if (!response.ok) {
    throw new Error(`Microsoft feed returned HTTP ${response.status}`);
  }

  return new NextResponse(await readMicrosoftFeedBody(response), {
    headers: FEED_RESPONSE_HEADERS,
  });
}
