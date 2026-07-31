import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/updates';
const CVRF_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/cvrf/';
const RESPONSE_HEADERS = {
  'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(req: NextRequest) {
  const monthId = req.nextUrl.searchParams.get('monthId');

  try {
    if (monthId) {
      if (!/^\d{4}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(monthId)) {
        return NextResponse.json({ error: 'Invalid monthId format' }, { status: 400 });
      }

      const response = await fetch(CVRF_URL + encodeURIComponent(monthId), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 900 },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch CVEs for month' }, { status: 502 });
      }
      return NextResponse.json(await response.json(), { headers: RESPONSE_HEADERS });
    }

    const response = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 502 });
    }
    return NextResponse.json(await response.json(), { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error('MSRC API error:', error);
    return NextResponse.json(
      { error: 'Security update data is temporarily unavailable' },
      { status: 502 }
    );
  }
}
