import { NextResponse } from 'next/server';
import { fetchMicrosoftFeed, readMicrosoftFeedBody } from '@/lib/feed/upstream';

const MICROSOFT_BLOG_FEED_URL = 'https://blogs.microsoft.com/feed/';
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
  'X-Content-Type-Options': 'nosniff',
} as const;

const authorSlugOverrides: Record<string, string> = {
  'Frank X. Shaw': 'frankxshaw',
  'Jared Spataro': 'jspataro',
  'Alysa Taylor': 'ataylor',
  'Paul Nyhan': 'pnyhan',
  'Nicole Dezen': 'ndezen',
};

const authorTitleOverrides: Record<string, string> = {
  'Paul Nyhan': 'Senior Communications Manager',
};

async function getAuthorTitle(slug: string, name: string): Promise<string> {
  if (authorTitleOverrides[name]) return authorTitleOverrides[name];

  try {
    const response = await fetch(`https://blogs.microsoft.com/blog/author/${slug}/`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Pulse360/1.0; +https://github.com/russrimm/Pulse360)',
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return '';

    const html = await readMicrosoftFeedBody(response);
    const titleMatch = html.match(/<title>Author: [^-]+-\s*([\s\S]*?)\s*\|/i);
    if (titleMatch?.[1]) return titleMatch[1].trim();

    const authorLinkMatch = html.match(
      /<a [^>]*aria-label="See more written by [^"]+">([^<]+)<\/a>/i
    );
    if (!authorLinkMatch?.[1]) return '';

    const parts = authorLinkMatch[1].split(' - ');
    return parts.length > 1 ? parts.slice(1).join(' - ').trim() : '';
  } catch {
    return '';
  }
}

async function hasRecentPosts(slug: string): Promise<boolean> {
  try {
    const response = await fetchMicrosoftFeed(
      `https://blogs.microsoft.com/blog/author/${slug}/feed/`
    );
    if (!response.ok) return false;

    const xml = await readMicrosoftFeedBody(response);
    const pubDates = Array.from(xml.matchAll(/<pubDate>(.*?)<\/pubDate>/g)).map(match => match[1]);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    return pubDates.some(value => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= twelveMonthsAgo;
    });
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const response = await fetchMicrosoftFeed(MICROSOFT_BLOG_FEED_URL);
    if (!response.ok) throw new Error('Failed to fetch Microsoft Blog news');

    const xml = await readMicrosoftFeedBody(response);
    const matches = Array.from(xml.matchAll(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/g));
    const authors = Array.from(new Set(matches.map(match => match[1].trim()).filter(Boolean)));
    let authorObjects = (
      await Promise.all(
        authors.map(async name => {
          const slug =
            authorSlugOverrides[name] ||
            name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
          const [title, isRecent] = await Promise.all([
            getAuthorTitle(slug, name),
            hasRecentPosts(slug),
          ]);
          return isRecent ? { name, title, slug } : null;
        })
      )
    ).filter((author): author is { name: string; title: string; slug: string } => author !== null);

    authorObjects = authorObjects.map(author =>
      author.name === 'Microsoft Corporate Blogs'
        ? { ...author, name: 'Microsoft Corporate' }
        : author
    );
    const corporateIndex = authorObjects.findIndex(author => author.name === 'Microsoft Corporate');
    const nicoleIndex = authorObjects.findIndex(author => author.name === 'Nicole Dezen');
    if (corporateIndex !== -1 && nicoleIndex > corporateIndex) {
      const [nicole] = authorObjects.splice(nicoleIndex, 1);
      authorObjects.splice(corporateIndex, 0, nicole);
    }

    return NextResponse.json(authorObjects, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching Microsoft News authors:', error);
    return NextResponse.json({ error: 'Microsoft News authors unavailable' }, { status: 502 });
  }
}
