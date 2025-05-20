'use client';

import { ProductNews } from '@/lib/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6 flex flex-col h-full">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-3">
          {new Date(news.publishDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {decodedTitle}
        </h3>
        
        {isCopilotStudio ? (
          <div className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">
            {enabledFor && (
              <p className="mb-2">
                <span className="font-medium">Enabled for:</span> {enabledFor}
              </p>
            )}
            {isValidDate(publicPreview) && (
              <p className="mb-2">
                <span className="font-medium">Public Preview:</span> {new Date(publicPreview!).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
            {isValidDate(generalAvailability) && (
              <p className="mb-2">
                <span className="font-medium">General Availability:</span> {new Date(generalAvailability!).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">
              {decodedDescription}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">
            {decodedDescription}
          </p>
        )}

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
  );
} 