import { getFabricBlogNews } from '@/lib/api'
import { ProductNewsLayout } from '@/components/ProductNewsLayout'
import Link from 'next/link'

export const revalidate = 3600

export default async function FabricBlogNewsPage() {
  const news = await getFabricBlogNews()
  return (
    <ProductNewsLayout
      title="Microsoft Fabric Blog"
      description="Latest updates, announcements, and features from the Microsoft Fabric Blog."
      icon="/icons/fabric_48_color.svg"
    >
      <div className="space-y-6 mt-8">
        {news.length === 0 && <div className="text-gray-500">No news found.</div>}
        {news.map(item => (
          <div key={item.id} className="border rounded-lg p-4 bg-white/80 dark:bg-gray-900/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <Link href={item.link} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary-700 dark:text-primary-300 hover:underline">
                {item.title}
              </Link>
              <span className="text-xs text-gray-500">{new Date(item.publishDate).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: item.description }} />
            {item.categories?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.categories.map((cat: string) => (
                  <span key={cat} className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ProductNewsLayout>
  )
} 