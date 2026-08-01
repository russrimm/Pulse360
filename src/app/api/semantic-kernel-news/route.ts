import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://devblogs.microsoft.com/semantic-kernel/feed/';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Semantic Kernel news:', error);
    return NextResponse.json({ error: 'Semantic Kernel feed unavailable' }, { status: 502 });
  }
}
