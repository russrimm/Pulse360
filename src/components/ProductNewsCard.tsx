'use client';

import { ProductNews } from '@/lib/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from './Card';

interface ProductNewsCardProps {
  news: ProductNews;
  productIcon?: string;
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

    setDecodedTitle(decodeHtmlEntities(news.title));
    setDecodedDescription(decodeHtmlEntities(news.description.replace(/<[^>]*>/g, '')));
    setDecodedAuthor(decodeHtmlEntities(news.author));
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
    <Card>
      <div className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2">
            {decodedTitle}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {new Date(news.publishDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {decodedDescription}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {!productIcon.includes('CopilotStudio') && !productIcon.includes('PowerPlatform') && productIcon !== '/icons/Windows.svg' && news.categories && news.categories.length > 0 && (
              <span>{news.categories.join(', ')}</span>
            )}
          </div>
          <Link
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
          >
            Read more →
          </Link>
        </div>
      </div>
    </Card>
  );
} 