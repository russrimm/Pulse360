'use client';

import { getPowerPlatformNews } from '@/lib/api.client';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { useQuery } from '@tanstack/react-query';
import { ProductNews } from '@/lib/types';

export default function PowerPlatformNewsPage() {
  const { data: news, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['powerPlatformNews'],
    queryFn: getPowerPlatformNews,
  });

  return (
    <ProductNewsLayout
      title="Power Platform News"
      description="Stay up to date with the latest news and announcements from Microsoft Power Platform."
      icon="/icons/PowerPlatform_scalable.svg"
    >
      {isLoading ? (
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
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error instanceof Error ? error.message : 'Failed to load news. Please try again later.'}</p>
          <button 
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news?.map((item) => (
            <ProductNewsCard 
              key={item.id} 
              news={item} 
              productIcon="/icons/PowerPlatform_scalable.svg"
            />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  );
} 