'use client';

import { ProductNewsCard } from '@/components/ProductNewsCard';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { useEffect, useState } from 'react';
import { ProductNews } from '@/lib/types';

export default function AzureAIMLNewsPage() {
  const [news, setNews] = useState<ProductNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/azure-ai-ml-news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setNews(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Azure AI + ML news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <ProductNewsLayout
      title="Azure AI + Machine Learning"
      description="Stay up to date with the latest news and announcements from Azure AI and Machine Learning services."
      icon="/icons/azure/ai + machine learning/00028-icon-service-Batch-AI.svg"
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-8 px-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-full max-w-md mx-auto min-w-0">
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 animate-pulse flex flex-col h-full">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 mx-auto" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2 mx-auto" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2 mx-auto" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2 mx-auto" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6 mx-auto" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mt-auto" />
              </div>
            </div>
          ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-8 px-2">
          {news.map((item, index) => (
            <ProductNewsCard 
              key={`azure-ai-ml-item-${index}`} 
              news={item} 
              productIcon="/icons/azure/ai + machine learning/00028-icon-service-Batch-AI.svg"
            />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  );
} 