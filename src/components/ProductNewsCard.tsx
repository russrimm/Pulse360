'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import type { ProductNews } from '@/lib/types';
import { getFeedTimestamp } from '@/lib/feed/normalize';
import { normalizeFeedText } from '@/lib/feed/text';
import { SurfaceCard } from './SurfaceCard';
import { MetaRow } from './MetaRow';

interface ProductNewsCardProps {
  news: ProductNews;
  /** Either an icon path (rendered as an image) or an already-rendered node. */
  productIcon?: string | ReactNode;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function getAuthorSlug(author: string): string {
  return author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function Author({ author }: { author: string }) {
  const slug = getAuthorSlug(author);
  if (!slug) return <>{author}</>;
  return (
    <a
      href={`https://blogs.microsoft.com/blog/author/${slug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded underline-offset-2 hover:text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {author}
    </a>
  );
}

export function ProductNewsCard({ news, productIcon }: ProductNewsCardProps) {
  const title = normalizeFeedText(typeof news.title === 'string' ? news.title : '');
  const description = normalizeFeedText(
    typeof news.description === 'string' ? news.description : ''
  );
  const author = normalizeFeedText(typeof news.author === 'string' ? news.author : '');
  const publishTimestamp = getFeedTimestamp(news.publishDate);
  const hasLink = typeof news.link === 'string' && news.link.startsWith('https://');
  const headline = title || 'Untitled update';

  return (
    <SurfaceCard as="article" interactive className="group gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {productIcon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken">
            {typeof productIcon === 'string' ? (
              <Image src={productIcon} alt="" width={20} height={20} className="h-5 w-5" />
            ) : (
              productIcon
            )}
          </span>
        ) : null}
        <h3 className="type-card-title min-w-0 text-ink [overflow-wrap:anywhere]">
          {hasLink ? (
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded transition-colors group-hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {headline}
            </a>
          ) : (
            headline
          )}
        </h3>
      </div>

      <MetaRow
        items={[
          publishTimestamp ? (
            <time dateTime={news.publishDate} className="tabular-nums">
              {dateFormatter.format(new Date(publishTimestamp))}
            </time>
          ) : null,
          author ? <Author author={author} /> : null,
        ]}
      />

      {description ? (
        <p className="type-body-sm line-clamp-4 break-words text-ink-muted">{description}</p>
      ) : null}

      {hasLink ? (
        <div className="mt-auto pt-1">
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="type-body-sm inline-flex items-center gap-1 rounded font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Read ${headline}`}
          >
            Read more
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>
        </div>
      ) : null}
    </SurfaceCard>
  );
}
