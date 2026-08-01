import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://blogs.microsoft.com/feed/';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Microsoft Blog news:', error);
    return NextResponse.json({ error: 'Microsoft Blog feed unavailable' }, { status: 502 });
  }
}
