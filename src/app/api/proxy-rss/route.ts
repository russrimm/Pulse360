import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }
  try {
    const res = await fetch(url);
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
    return new NextResponse('Error fetching RSS feed', { status: 500 });
  }
} 