import { ProductNewsLayout } from '@/components/ProductNewsLayout'
import { ProductNewsCard } from '@/components/ProductNewsCard'
import { FabricBlogNewsClient } from './FabricBlogNewsClient'

export const revalidate = 3600

function highlightContinueReading(html: string) {
  // Replace <a ...>Continue reading</a> with 'Continue reading ' + <a ...>here</a>
  return html.replace(
    /<a ([^>]*class=")?([^"]*)?more-link([^"]*)?"?([^>]*)>(Continue reading)(<span[^>]*>[^<]*<\/span>)?<\/a>/g,
    '<span class="font-medium mr-1">Continue reading</span><a $1$2more-link$3 text-primary-700 dark:text-primary-300 underline hover:text-primary-900 hover:dark:text-primary-200 transition-colors$4>$6</a>'
  )
}

export default async function FabricBlogNewsPage() {
  return (
    <ProductNewsLayout
      title="Fabric Blog News"
      description="Latest updates from the Fabric Blog."
      icon="/icons/fabric_48_color.svg"
    >
      <FabricBlogNewsClient />
    </ProductNewsLayout>
  )
} 