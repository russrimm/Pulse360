import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/updates';
const CVRF_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/cvrf/';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthId = searchParams.get('monthId');
  try {
    if (monthId) {
      // Proxy CVRF details for a specific month
      const res = await fetch(CVRF_URL + monthId, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch CVEs for month' }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      // Proxy the months list
      const res = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch updates' }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
} 