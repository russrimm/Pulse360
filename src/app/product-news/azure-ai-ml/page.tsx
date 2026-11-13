'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getProductNewsFeed } from '@/lib/product-news';
import type { ProductNews } from '@/lib/types';

const feed = getProductNewsFeed('/product-news/azure-ai-ml');

async function getAzureAIMLNews(): Promise<ProductNews[]> {
  const response = await fetch('/api/azure-ai-ml-news');
  if (!response.ok) throw new Error('Failed to fetch Azure AI + Machine Learning news');
  return (await response.json()) as ProductNews[];
}

export default function AzureAIMLNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid queryKey="azureAIMLNews" queryFn={getAzureAIMLNews} productIcon={feed.icon} />
    </ProductNewsLayout>
  );
}
