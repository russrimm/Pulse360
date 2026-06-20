"use client"
import { useQuery } from '@tanstack/react-query';
import { getAzureAIFoundryNews } from "@/lib/api.client"
import { ProductNewsCard } from "@/components/ProductNewsCard"
import { ProductNewsLayout } from "@/components/ProductNewsLayout"
import type { ProductNews } from "@/lib/types"

export default function AzureAIFoundryNewsPage() {
  const { data: news, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['azureAIFoundryNews'],
    queryFn: getAzureAIFoundryNews,
  });

  return (
    <>
      <ProductNewsLayout
        title="Azure AI Foundry"
        description="Latest updates from the Azure AI Foundry team."
        icon="https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/03/cropped-ai-foundry-32x32.png"
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
                productIcon="https://devblogs.microsoft.com/foundry/wp-content/uploads/sites/89/2025/03/cropped-ai-foundry-32x32.png"
              />
            ))}
          </div>
        )}
      </ProductNewsLayout>
    </>
  )
} 