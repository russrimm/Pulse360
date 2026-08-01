import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { fetchMicrosoftFeed, readMicrosoftFeedBody } from '@/lib/feed/upstream';

const FEED_URL = 'https://azure.microsoft.com/en-us/blog/category/ai-machine-learning/feed/';
interface AzureFeedItem {
  guid?: string | { '#text'?: string };
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  author?: string;
  'content:encoded'?: string;
  'dc:creator'?: string;
  category?: string | string[];
}

interface AzureFeedDocument {
  rss?: {
    channel?: {
      item?: AzureFeedItem | AzureFeedItem[];
    };
  };
}

function getGuid(item: AzureFeedItem): string {
  if (typeof item.guid === 'string') return item.guid;
  return item.guid?.['#text'] ?? '';
}

function createUniqueId(item: AzureFeedItem): string {
  const titleHash = item.title
    ? item.title
        .slice(0, 80)
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
    : 'no-title';
  return `azure-ai-ml-${titleHash}`;
}

function normalizePublishDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export async function GET() {
  try {
    const response = await fetchMicrosoftFeed(FEED_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await readMicrosoftFeedBody(response);
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseTagValue: false,
    });

    const result = parser.parse(xml) as AzureFeedDocument;
    const items = result.rss?.channel?.item;
    const itemArray: AzureFeedItem[] = items ? (Array.isArray(items) ? items : [items]) : [];

    const news = itemArray.map(item => ({
      id: getGuid(item) || item.link || createUniqueId(item),
      title: item.title || '',
      description: item.description || '',
      content: item['content:encoded'] || item.description || '',
      link: item.link || '',
      publishDate: normalizePublishDate(item.pubDate),
      author: item.author || item['dc:creator'] || 'Azure Team',
      categories: Array.isArray(item.category)
        ? item.category
        : item.category
          ? [item.category]
          : ['AI + Machine Learning'],
      image: null,
    }));

    return NextResponse.json(news, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('Error fetching Azure AI + ML news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 502 });
  }
}
