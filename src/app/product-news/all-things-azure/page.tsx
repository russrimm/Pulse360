import { ProductNewsLayout } from '@/components/ProductNewsLayout'
import { ProductNewsCard } from '@/components/ProductNewsCard'
import { ProductNews } from '@/lib/types'
// @ts-ignore
import { parseStringPromise } from 'xml2js'

async function fetchRSS(): Promise<ProductNews[]> {
  const res = await fetch('https://devblogs.microsoft.com/all-things-azure/feed/', { next: { revalidate: 1800 } })
  const xml = await res.text()
  const parsed = await parseStringPromise(xml)
  const items = parsed.rss.channel[0].item || []
  return items.map((item: any) => ({
    id: item.guid?.[0]._ || item.link?.[0] || item.title?.[0],
    title: item.title?.[0] || '',
    link: item.link?.[0] || '',
    description: item.description?.[0] || '',
    publishDate: item.pubDate?.[0] || '',
    author: item['dc:creator']?.[0] || item.author?.[0] || 'All Things Azure',
    categories: item.category ? item.category.map((c: any) => c._ || c) : [],
  }))
}

export default async function AllThingsAzurePage() {
  const posts = await fetchRSS()
  return (
    <ProductNewsLayout
      title="All Things Azure"
      description="Latest posts from the All Things Azure blog."
      icon="/icons/Azure.svg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(post => (
          <ProductNewsCard key={post.id} news={post} productIcon="/icons/Azure.svg" />
        ))}
      </div>
    </ProductNewsLayout>
  )
} 