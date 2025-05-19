import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://learn.microsoft.com/en-us/power-platform/release-plan/2024wave2/microsoft-copilot-studio/planned-features', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Failed to fetch Copilot Studio news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      return NextResponse.json({ items: [] });
    }

    const html = await response.text();
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error fetching Copilot Studio news:', error);
    return NextResponse.json({ items: [] });
  }
} 