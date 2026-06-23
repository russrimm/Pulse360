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
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
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
    const res = await fetch(parsed.toString(), { redirect: 'manual' });
    if (!res.ok) {
      return new NextResponse('Failed to fetch RSS feed', { status: 502 });
    }
    const xml = await res.text();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=600, stale-while-revalidate',
      },
    });
  } catch (e) {
    console.error('proxy-rss fetch failed', { host: parsed.hostname, err: e });
    return new NextResponse('Error fetching RSS feed', { status: 500 });
  }
}