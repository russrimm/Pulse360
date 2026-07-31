'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { ProductNews } from '@/lib/types';

interface ProductNewsCardProps {
  news: ProductNews;
  productIcon?: ReactNode;
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

function formatPublishDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function Author({ author }: { author: string }) {
  const slug = getAuthorSlug(author);
  if (!slug) return null;

  return (
    <p className="mb-2 text-center text-xs text-gray-500 dark:text-gray-400">
      Published by{' '}
      <a
        href={`https://blogs.microsoft.com/blog/author/${slug}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:text-primary-300"
      >
        {author}
      </a>
    </p>
  );
}

export function ProductNewsCard({ news }: ProductNewsCardProps) {
  const [decodedTitle, setDecodedTitle] = useState(news.title);
  const [decodedDescription, setDecodedDescription] = useState(news.description);
  const [decodedAuthor, setDecodedAuthor] = useState(news.author);

  useEffect(() => {
    function decodeHtmlEntities(text: string): string {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }

    const title = typeof news.title === 'string' ? news.title : '';
    const description = typeof news.description === 'string' ? news.description : '';
    const author = typeof news.author === 'string' ? news.author : '';

    setDecodedTitle(decodeHtmlEntities(title));
    setDecodedDescription(decodeHtmlEntities(description.replace(/<[^>]*>/g, '')));
    setDecodedAuthor(decodeHtmlEntities(author));
  }, [news.author, news.description, news.title]);

  const formattedDate = formatPublishDate(news.publishDate);
  const hasLink = typeof news.link === 'string' && news.link.startsWith('https://');

  return (
    <article className="mx-auto h-full w-full min-w-0 max-w-md rounded-xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none dark:border-gray-700/50 dark:bg-gray-800/50 dark:hover:border-primary-800">
      <div className="flex h-full min-w-0 flex-col p-4">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 w-full overflow-hidden text-center text-lg font-bold text-gray-900 [overflow-wrap:anywhere] dark:text-white">
            {hasLink ? (
              <a
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:text-primary-400"
              >
                {decodedTitle || 'Untitled update'}
              </a>
            ) : (
              decodedTitle || 'Untitled update'
            )}
          </h3>
          {formattedDate ? (
            <time
              dateTime={news.publishDate}
              className="mb-0 block text-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {formattedDate}
            </time>
          ) : null}
          {decodedAuthor ? <Author author={decodedAuthor} /> : null}
          {decodedDescription ? (
            <p className="mt-2 line-clamp-3 break-words text-center text-base text-gray-700 dark:text-gray-300">
              {decodedDescription}
            </p>
          ) : null}
        </div>
        {hasLink ? (
          <div className="mt-4 flex justify-end">
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              aria-label={`Read ${decodedTitle || 'this update'}`}
            >
              Read more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
