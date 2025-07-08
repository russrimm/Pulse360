'use client'

import { useQuery } from '@tanstack/react-query'
import { getFabricBlogNews } from '@/lib/api'
import { ProductNewsCard } from '@/components/ProductNewsCard'
import type { ProductNews } from '@/lib/types'

export function FabricBlogNewsClient() {
  const { data: news, isLoading, isError, error, refetch } = useQuery<ProductNews[]>({
    queryKey: ['fabricBlogNews'],
    queryFn: getFabricBlogNews,
  })

  if (isLoading)
    return <div className="text-gray-500">Loading news...</div>

  if (isError)
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error instanceof Error ? error.message : 'Failed to load news. Please try again later.'}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news?.map((item) => (
        <ProductNewsCard
          key={item.id}
          news={item}
          productIcon="/icons/fabric_48_color.svg"
        />
      ))}
    </div>
  )
} 