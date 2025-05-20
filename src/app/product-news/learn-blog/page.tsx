'use client';

import { getLearnBlogNews } from '@/lib/api';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductNews } from '@/lib/types';

const products = [
  {
    name: 'Power Apps',
    icon: '/icons/PowerApps_scalable.svg',
    href: '/product-news',
    current: false
  },
  {
    name: 'Power Automate',
    icon: '/icons/PowerAutomate_scalable.svg',
    href: '/product-news/power-automate',
    current: false
  },
  {
    name: 'Power BI',
    icon: '/icons/PowerBI_scalable.svg',
    href: '/product-news/power-bi',
    current: false
  },
  {
    name: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
    current: false
  },
  {
    name: 'Copilot Studio',
    icon: '/icons/CopilotStudio_scalable.svg',
    href: '/product-news/copilot-studio',
    current: false
  },
  {
    name: 'Learn Blog',
    icon: '/icons/m365.svg',
    href: '/product-news/learn-blog',
    current: true
  },
  {
    name: 'Microsoft News',
    icon: '/icons/Windows.svg',
    href: '/product-news/microsoft-news',
    current: false
  },
  {
    name: 'Tech Community',
    href: '/product-news/tech-community',
    current: false
  }
];

export default function LearnBlogNewsPage() {
  const [news, setNews] = useState<ProductNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getLearnBlogNews();
        setNews(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/icons/m365.svg"
              alt="Learn Blog"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Learn Blog
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Stay up to date with the latest news and announcements from Microsoft Learn.
          </p>
        </div>

        <div className="mt-8 mb-6">
          <div className="flex flex-wrap gap-4">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  product.current
                    ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800'
                    : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                }`}
              >
                {product.icon && product.icon !== '' && (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={product.current ? 32 : 20}
                    height={product.current ? 32 : 20}
                    className={`${product.current ? 'w-8 h-8' : 'w-5 h-5'} ${product.current ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
                <span className={`text-sm font-medium ${
                  product.current
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {product.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <ProductNewsCard 
                key={item.id} 
                news={item} 
                productIcon="/icons/m365.svg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 