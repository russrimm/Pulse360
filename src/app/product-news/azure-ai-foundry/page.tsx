'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getAzureAIFoundryNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/azure-ai-foundry');

export default function AzureAIFoundryNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid
        queryKey="azureAIFoundryNews"
        queryFn={getAzureAIFoundryNews}
        productIcon={feed.icon}
      />
    </ProductNewsLayout>
  );
}
