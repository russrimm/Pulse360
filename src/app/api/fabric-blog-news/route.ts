import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { fetchMicrosoftFeed, readMicrosoftFeedBody } from '@/lib/feed/upstream';

const FEED_URL =
  'https://community.fabric.microsoft.com/oxcrx34285/rss/board?board.id=fbc_fabricupdatesblogs';

interface FabricFeedItem {
  guid?: unknown;
  title?: unknown;
  link?: unknown;
  pubDate?: unknown;
  description?: unknown;
}

interface FabricFeedDocument {
  rss?: {
    channel?: {
      item?: FabricFeedItem | FabricFeedItem[];
    };
  };
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && '_' in value) {
    const text = (value as { _: unknown })._;
    return typeof text === 'string' || typeof text === 'number' ? String(text) : '';
  }
  return '';
}

export async function GET() {
  try {
    const response = await fetchMicrosoftFeed(FEED_URL);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 502 });
    }

    const xml = await readMicrosoftFeedBody(response);
    const parsed = (await parseStringPromise(xml, { explicitArray: false })) as FabricFeedDocument;
    const items = parsed.rss?.channel?.item;
    const news = items ? (Array.isArray(items) ? items : [items]) : [];
    const result = news.map(item => {
      const title = textValue(item.title);
      const publishDate = textValue(item.pubDate);
      const link = textValue(item.link);
      return {
        id: textValue(item.guid) || link || `${title}-${publishDate}`,
        title,
        link,
        publishDate,
        description: textValue(item.description),
      };
    });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('fabric-blog-news parse error:', error);
    return NextResponse.json({ error: 'Failed to parse feed' }, { status: 502 });
  }
}
