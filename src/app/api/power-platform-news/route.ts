import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://www.microsoft.com/en-us/power-platform/blog/feed';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Power Platform news:', error);
    return NextResponse.json({ error: 'Power Platform feed unavailable' }, { status: 502 });
  }
}
