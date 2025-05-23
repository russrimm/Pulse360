'use client';

import { getPowerAppsNews } from '@/lib/api';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductNews } from '@/lib/types';
import { usePathname } from 'next/navigation';

const products = [
  {
    name: 'Power Apps',
    icon: '/icons/PowerApps_scalable.svg',
    href: '/product-news',
  },
  {
    name: 'Power Automate',
    icon: '/icons/PowerAutomate_scalable.svg',
    href: '/product-news/power-automate',
  },
  {
    name: 'Power BI',
    icon: '/icons/PowerBI_scalable.svg',
    href: '/product-news/power-bi',
  },
  {
    name: 'Power Platform',
    icon: '/icons/PowerPlatform_scalable.svg',
    href: '/product-news/power-platform',
  },
  {
    name: 'Copilot Studio',
    icon: '/icons/CopilotStudio_scalable.svg',
    href: '/product-news/copilot',
  },
  {
    name: 'Learn Blog',
    icon: '/icons/m365.svg',
    href: '/product-news/learn-blog',
  },
  {
    name: 'Microsoft News',
    icon: '/icons/Windows.svg',
    href: '/product-news/microsoft-news',
  },
  {
    name: 'Tech Community',
    href: '/product-news/tech-community',
  }
];

export default function PowerAppsNewsPage() {
  const pathname = usePathname();
  const [news, setNews] = useState<ProductNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getPowerAppsNews();
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
              src="/icons/PowerApps_scalable.svg"
              alt="Power Apps"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Power Apps News
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Stay up to date with the latest news and announcements from Microsoft Power Apps.
          </p>
        </div>

        <div className="mt-4 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className={`flex items-center justify-center gap-2 px-2.5 py-1 rounded-lg border transition-all duration-200 w-32 ${
                  pathname === product.href
                    ? 'bg-primary-100 border-primary-300 dark:bg-primary-900/50 dark:border-primary-700 shadow-sm ring-1 ring-primary-200 dark:ring-primary-800'
                    : 'bg-white/80 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                }`}
              >
                {product.icon && product.icon !== '' && (
                  <Image
                    src={product.icon}
                    alt={product.name}
                    width={16}
                    height={16}
                    className={`w-4 h-4 ${pathname === product.href ? 'opacity-100' : 'opacity-70'}`}
                  />
                )}
                <span className={`text-xs font-medium ${
                  pathname === product.href
                    ? 'text-primary-800 dark:text-primary-200 font-semibold'
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
                productIcon="/icons/PowerApps_scalable.svg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 