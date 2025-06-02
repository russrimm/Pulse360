"use client"
import { useEffect, useState } from "react"
import { getSemanticKernelNews } from "@/lib/api"
import { ProductNewsCard } from "@/components/ProductNewsCard"
import { ProductNewsLayout } from "@/components/ProductNewsLayout"
import type { ProductNews } from "@/lib/types"

export default function SemanticKernelNewsPage() {
  const [news, setNews] = useState<ProductNews[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSemanticKernelNews()
      .then(setNews)
      .catch(() => setError("Failed to load news. Please try again later."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProductNewsLayout
      title="Semantic Kernel"
      description="Latest updates from the Semantic Kernel team."
      icon="/icons/sklogo.svg"
    >
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {news.map((item) => (
            <ProductNewsCard key={item.id} news={item} productIcon="/icons/sklogo.svg" />
          ))}
        </div>
      )}
    </ProductNewsLayout>
  )
} 