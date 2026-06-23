'use client';

import { getMicrosoftNews } from '@/lib/api.client';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { useQuery } from '@tanstack/react-query';
import { ProductNews } from '@/lib/types';

export default function MicrosoftNewsPage() {
  const { data: news, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['microsoftNews'],
    queryFn: getMicrosoftNews,
  });

  return (
    <>
      <ProductNewsLayout
        title="Microsoft News"
        description="Stay up to date with the latest news and announcements from Microsoft."
        icon={
          <svg aria-hidden="true" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" width={32} height={32} style={{display:'inline-block'}}>
            <path d="M11.5216 0.5H0V11.9067H11.5216V0.5Z" fill="#f25022"></path>
            <path d="M24.2418 0.5H12.7202V11.9067H24.2418V0.5Z" fill="#7fba00"></path>
            <path d="M11.5216 13.0933H0V24.5H11.5216V13.0933Z" fill="#00a4ef"></path>
            <path d="M24.2418 13.0933H12.7202V24.5H24.2418V13.0933Z" fill="#ffb900"></path>
          </svg>
        }
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
              />
            ))}
          </div>
        )}
      </ProductNewsLayout>
    </>
  );
} 