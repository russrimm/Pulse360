'use client';

import { getPowerAutomateNews } from '@/lib/api';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { useEffect, useState } from 'react';
import { ProductNews } from '@/lib/types';

export default function PowerAutomateNewsPage() {
  const [news, setNews] = useState<ProductNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getPowerAutomateNews();
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
    <ProductNewsLayout
      title="Power Automate News"
      description="Stay up to date with the latest news and announcements from Microsoft Power Automate."
      icon="/icons/PowerAutomate_scalable.svg"
    >
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
              productIcon="/icons/PowerAutomate_scalable.svg"
            />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  );
} 