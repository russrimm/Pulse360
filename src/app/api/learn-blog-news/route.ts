import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL =
  'https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=MicrosoftLearnBlog';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Learn Blog RSS feed:', error);
    return NextResponse.json({ error: 'Microsoft Learn feed unavailable' }, { status: 502 });
  }
}
