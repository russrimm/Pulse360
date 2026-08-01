import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://powerapps.microsoft.com/en-us/blog/feed';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Power Apps news:', error);
    return NextResponse.json({ error: 'Power Apps feed unavailable' }, { status: 502 });
  }
}
