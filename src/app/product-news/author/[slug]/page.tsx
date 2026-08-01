'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getMicrosoftNewsAuthors } from '@/lib/api.client';
import { getFeedTimestamp } from '@/lib/feed/normalize';
import type { ProductNews } from '@/lib/types';

function slugToName(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function AuthorNewsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const authorFeed = useQuery({
    queryKey: ['microsoftNewsAuthorFeed', slug],
    queryFn: () => fetchAuthorFeed(slug),
    enabled: Boolean(slug),
  });
  const authors = useQuery({
    queryKey: ['microsoftNewsAuthors'],
    queryFn: getMicrosoftNewsAuthors,
  });
  const author = authors.data?.find(candidate => candidate.slug === slug);
  const authorName = author?.name ?? slugToName(slug || '');
  const authorTitle = author?.title;
  const news = (authorFeed.data ?? []).map(item => ({ ...item, author: authorName }));

  const titleText = authorTitle
    ? `Posts by ${authorName} - ${authorTitle}`
    : `Posts by ${authorName}`;

  return (
    <ProductNewsLayout
      title={
        <span className="text-sm md:text-base font-semibold whitespace-normal break-words">
          {titleText}
        </span>
      }
      icon="/icons/Windows.svg"
    >
      {authorFeed.isLoading ? (
        <div role="status" aria-live="polite">
          Loading author posts...
        </div>
      ) : authorFeed.isError ? (
        <div role="alert">
          <p>Failed to load author posts.</p>
          <button type="button" onClick={() => authorFeed.refetch()}>
            Try again
          </button>
        </div>
      ) : news.length === 0 ? (
        <p role="status">No recent posts were found for this author.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => (
            <ProductNewsCard key={item.id} news={item} productIcon="/icons/Windows.svg" />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  );
}

async function fetchAuthorFeed(slug: string | undefined): Promise<ProductNews[]> {
  if (!slug) return [];

  const response = await fetch(`/api/author-feed?slug=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error('Microsoft author feed unavailable');
  }

  const xml = await response.text();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  return Array.from(doc.querySelectorAll('item'))
    .map(item => {
      const link = item.querySelector('link')?.textContent?.trim() || '';
      const publishDate = item.querySelector('pubDate')?.textContent?.trim() || '';
      const timestamp = getFeedTimestamp(publishDate);
      return {
        id: item.querySelector('guid')?.textContent?.trim() || link,
        title: item.querySelector('title')?.textContent?.trim() || '',
        link,
        description: item.querySelector('description')?.textContent || '',
        publishDate: timestamp ? new Date(timestamp).toISOString() : '',
        author: slugToName(slug),
        categories: Array.from(item.querySelectorAll('category')).map(
          category => category.textContent || ''
        ),
      };
    })
    .filter(post => getFeedTimestamp(post.publishDate) >= twelveMonthsAgo.getTime());
}
