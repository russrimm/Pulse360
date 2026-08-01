import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/Community';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Tech Community RSS feed:', error);
    return NextResponse.json({ error: 'Tech Community feed unavailable' }, { status: 502 });
  }
}
