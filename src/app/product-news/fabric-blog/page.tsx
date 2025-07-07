import { getFabricBlogNews } from '@/lib/api'
import { ProductNewsLayout } from '@/components/ProductNewsLayout'
import { ProductNewsCard } from '@/components/ProductNewsCard'

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
    <>
      <ProductNewsLayout
        title="Fabric News"
        description="Latest updates, announcements, and features from Microsoft Fabric."
        icon="/icons/fabric_48_color.svg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {news.length === 0 && <div className="text-gray-500">No news found.</div>}
          {news.map(item => (
            <ProductNewsCard key={item.id} news={item} productIcon="/icons/fabric_48_color.svg" />
          ))}
        </div>
      </ProductNewsLayout>
    </>
  )
} 