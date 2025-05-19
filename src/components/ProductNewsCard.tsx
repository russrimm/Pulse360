'use client';

import { ProductNews } from '@/lib/api';
import Image from 'next/image';
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <Image
              src={productIcon}
              alt="Product Icon"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {decodedTitle}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(news.publishDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {decodedDescription}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {decodedAuthor}
            </span>
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
    </div>
  );
} 