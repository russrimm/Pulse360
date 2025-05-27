import { getFabricBlogNews } from '@/lib/api'
import { ProductNewsLayout } from '@/components/ProductNewsLayout'
import Link from 'next/link'

export const revalidate = 3600

function highlightContinueReading(html: string) {
  // Replace <a ...>Continue reading</a> with 'Continue reading ' + <a ...>here</a>
  return html.replace(
    /<a ([^>]*class=")?([^"]*)?more-link([^"]*)?"?([^>]*)>(Continue reading)(<span[^>]*>[^<]*<\/span>)?<\/a>/g,
    '<span class="font-medium mr-1">Continue reading</span><a $1$2more-link$3 text-primary-700 dark:text-primary-300 underline hover:text-primary-900 hover:dark:text-primary-200 transition-colors$4>$6</a>'
  )
}

export default async function FabricBlogNewsPage() {
  const news = await getFabricBlogNews()
  return (
    <ProductNewsLayout
      title="Fabric News"
      description="Latest updates, announcements, and features from Microsoft Fabric."
      icon="/icons/fabric_48_color.svg"
    >
      <div className="space-y-6 mt-8">
        {news.length === 0 && <div className="text-gray-500">No news found.</div>}
        {news.map(item => (
          <Link
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-lg p-4 bg-white/80 dark:bg-gray-900/60 shadow-sm group transition hover:bg-primary-50/40 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <span className="text-lg font-semibold text-primary-700 dark:text-primary-300 group-hover:underline">
                {item.title}
              </span>
              <span className="text-xs text-gray-500">{new Date(item.publishDate).toLocaleDateString()}</span>
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: highlightContinueReading(item.description) }}
            />
            {item.categories?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.categories.map((cat: string) => (
                  <span key={cat} className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-xs font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </ProductNewsLayout>
  )
} 