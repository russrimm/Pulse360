import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://blogs.microsoft.com/feed/', {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Microsoft Blog news');
    }

    const xml = await response.text();
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    });
  } catch (error) {
    console.error('Error fetching Microsoft Blog news:', error);
    return new NextResponse('Error fetching Microsoft Blog news', { status: 500 });
  }
} 