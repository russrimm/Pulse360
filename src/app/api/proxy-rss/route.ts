import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'devblogs.microsoft.com',
  'blogs.windows.com',
  'blogs.microsoft.com',
  'techcommunity.microsoft.com',
  'azure.microsoft.com',
  'cloudblogs.microsoft.com',
  'powerplatform.microsoft.com',
  'www.microsoft.com',
  'microsoft.com',
  'code.visualstudio.com',
]);

const MAX_FEED_BYTES = 5 * 1024 * 1024;
const UPSTREAM_HEADERS = {
  Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; Pulse360/1.0; +https://github.com/russrimm/Pulse360)',
};

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  if (url.length > 2048) {
    return new NextResponse('URL is too long', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (parsed.protocol !== 'https:') {
    return new NextResponse('Only https URLs are allowed', { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  try {
    const response = await fetch(parsed.toString(), {
      redirect: 'manual',
      headers: UPSTREAM_HEADERS,
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 600 },
    });
    if (!response.ok) {
      return new NextResponse('Failed to fetch RSS feed', { status: 502 });
    }

    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_FEED_BYTES) {
      return new NextResponse('RSS feed is too large', { status: 502 });
    }

    const xml = await response.text();
    if (Buffer.byteLength(xml, 'utf8') > MAX_FEED_BYTES) {
      return new NextResponse('RSS feed is too large', { status: 502 });
    }

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('proxy-rss fetch failed', { host: parsed.hostname, error });
    return new NextResponse('Error fetching RSS feed', { status: 502 });
  }
}
