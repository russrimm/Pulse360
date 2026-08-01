import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://www.microsoft.com/en-us/microsoft-copilot/blog/feed/';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Copilot news:', error);
    return NextResponse.json({ error: 'Copilot feed unavailable' }, { status: 502 });
  }
}
