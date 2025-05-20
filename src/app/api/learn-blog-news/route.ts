import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=MicrosoftLearnBlog', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error fetching Learn Blog RSS feed:', error);
    return new NextResponse('Error fetching Learn Blog RSS feed', { status: 500 });
  }
} 