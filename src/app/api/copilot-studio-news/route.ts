import { NextResponse } from 'next/server';
import { COPILOT_STUDIO_RELEASE_URL } from '@/lib/feed/sources';

export async function GET() {
  try {
    const response = await fetch(COPILOT_STUDIO_RELEASE_URL, {
      headers: {
        Accept: 'text/html',
        'User-Agent':
          'Mozilla/5.0 (compatible; Pulse360/1.0; +https://github.com/russrimm/Pulse360)',
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.error('Failed to fetch Copilot Studio news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      return NextResponse.json(
        { error: 'Copilot Studio release plan unavailable' },
        { status: 502 }
      );
    }

    const html = await response.text();
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error fetching Copilot Studio news:', error);
    return NextResponse.json({ error: 'Copilot Studio release plan unavailable' }, { status: 502 });
  }
}
