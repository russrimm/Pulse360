import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.microsoft.com/en-us/microsoft-copilot/blog/feed/', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Copilot news:', {
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
    console.error('Error fetching Copilot news:', error);
    return NextResponse.json({ items: [] });
  }
} 