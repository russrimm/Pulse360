import { NextResponse } from 'next/server';
import {
  FEED_RESPONSE_HEADERS,
  fetchMicrosoftFeed,
  readMicrosoftFeedBody,
} from '@/lib/feed/upstream';

const FEED_URL =
  'https://community.fabric.microsoft.com/oxcrx34285/rss/board?board.id=fbc_pbiupdatesblog';

export async function GET() {
  try {
    const response = await fetchMicrosoftFeed(FEED_URL);

    if (!response.ok) {
      console.error('Failed to fetch Power BI news:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      return NextResponse.json({ error: 'Power BI feed unavailable' }, { status: 502 });
    }

    const xmlText = await readMicrosoftFeedBody(response);
    return new NextResponse(xmlText, {
      headers: FEED_RESPONSE_HEADERS,
    });
  } catch (error) {
    console.error('Error fetching Power BI news:', error);
    return NextResponse.json({ error: 'Power BI feed unavailable' }, { status: 502 });
  }
}
