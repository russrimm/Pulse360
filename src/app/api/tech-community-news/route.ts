import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/Community', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Tech Community RSS feed');
    }

    const xml = await response.text();
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    });
  } catch (error) {
    console.error('Error fetching Tech Community RSS feed:', error);
    return new NextResponse('Error fetching Tech Community RSS feed', { status: 500 });
  }
} 