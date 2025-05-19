import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://powerapps.microsoft.com/en-us/blog/feed', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Power Apps news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return NextResponse.json({ items: [] });
    }

    const xmlText = await response.text();
    return new NextResponse(xmlText, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error fetching Power Apps news:', error);
    return NextResponse.json({ items: [] });
  }
} 