'use client';

import { ProductNews } from '@/lib/types';
import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card } from './Card';

interface ProductNewsCardProps {
  news: ProductNews;
  productIcon?: string;
}

// Helper to get author slug for Microsoft News
function getAuthorSlug(author: string) {
  if (!author) return ''
  return author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Fetch author title from their blog page
function useAuthorTitle(author: string | undefined) {
  const [title, setTitle] = useState<string | null>(null)
  useEffect(() => {
    if (!author) return
    const slug = getAuthorSlug(author)
    if (!slug) return
    const url = `https://blogs.microsoft.com/blog/author/${slug}/`
    fetch(url)
      .then(res => res.text())
      .then(html => {
        const match = html.match(/<title>(.*?)<\/title>/i)
        if (match && match[1]) setTitle(match[1].replace(/\s*\|.*/, '').trim())
      })
      .catch(() => setTitle(null))
  }, [author])
  return title
}

function AuthorWithTitle({ author }: { author: string }) {
  const [title, setTitle] = useState<string | null>(null)
  useEffect(() => {
    if (!author) return
    const slug = getAuthorSlug(author)
    if (!slug) return
    const url = `https://blogs.microsoft.com/blog/author/${slug}/`
    fetch(url)
      .then(res => res.text())
      .then(html => {
        const match = html.match(/<title>(.*?)<\/title>/i)
        if (match && match[1]) {
          const parts = match[1].split('|')
          if (parts.length > 1) setTitle(parts[0].replace(/^Author: [^-]+- /, '').trim())
          else setTitle(null)
        }
      })
      .catch(() => setTitle(null))
  }, [author])
  const slug = getAuthorSlug(author)
  const authorUrl = `https://blogs.microsoft.com/blog/author/${slug}/`
  return (
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
      Published by{' '}
      <a href={authorUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-700">
        {author}
      </a>
      {title && <span> – {title}</span>}
    </p>
  )
}

export function ProductNewsCard({ news, productIcon = '/icons/PowerPlatform_scalable.svg' }: ProductNewsCardProps) {
  const [decodedTitle, setDecodedTitle] = useState(news.title);
  const [decodedDescription, setDecodedDescription] = useState(news.description);
  const [decodedAuthor, setDecodedAuthor] = useState(news.author);

  useEffect(() => {
    const decodeHtmlEntities = (text: string) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    const safeTitle = typeof news.title === 'string' ? news.title : '';
    const safeDescription = typeof news.description === 'string' ? news.description : '';
    const safeAuthor = typeof news.author === 'string' ? news.author : '';

    setDecodedTitle(decodeHtmlEntities(safeTitle));
    setDecodedDescription(decodeHtmlEntities(safeDescription.replace(/<[^>]*>/g, '')));
    setDecodedAuthor(decodeHtmlEntities(safeAuthor));
  }, [news]);

  const isCopilotStudio = productIcon?.includes('CopilotStudio');
  const descriptionLines = isCopilotStudio ? news.description.split('\n') : [];
  const enabledFor = descriptionLines.find(line => line.startsWith('Enabled for:'))?.replace('Enabled for:', '').trim();
  const publicPreview = descriptionLines.find(line => line.startsWith('Public Preview:'))?.replace('Public Preview:', '').trim();
  const generalAvailability = descriptionLines.find(line => line.startsWith('General Availability:'))?.replace('General Availability:', '').trim();

  const isValidDate = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  return (
    <div className="w-full max-w-md mx-auto min-w-0">
      <div className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col">
        <div
          className="p-4 flex flex-col h-full cursor-pointer min-w-0"
          onClick={() => window.open(news.link, '_blank', 'noopener,noreferrer')}
          tabIndex={0}
          role="button"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.open(news.link, '_blank', 'noopener,noreferrer') }}
          aria-label={`Open news: ${decodedTitle}`}
        >
          <div className="flex-1 w-full min-w-0">
            <h3 className="w-full overflow-hidden text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2 text-center" style={{ wordBreak: 'normal', overflowWrap: 'anywhere' }}>
              {decodedTitle}
            </h3>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0 text-center">
              {new Date(news.publishDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {news.author && <AuthorWithTitle author={news.author} />}
            <p className="text-base text-gray-700 dark:text-gray-300 line-clamp-3 text-center mt-2">
              {decodedDescription}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div />
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              tabIndex={-1}
            >
              Read more →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 