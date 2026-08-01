import { NextResponse } from 'next/server';
import { proxyMicrosoftFeed } from '@/lib/feed/upstream';

const FEED_URL = 'https://devblogs.microsoft.com/foundry/feed/';

export async function GET() {
  try {
    return await proxyMicrosoftFeed(FEED_URL);
  } catch (error) {
    console.error('Error fetching Azure AI Foundry news:', error);
    return NextResponse.json({ error: 'Azure AI Foundry feed unavailable' }, { status: 502 });
  }
}
