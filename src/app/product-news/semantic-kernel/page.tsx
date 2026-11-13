'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getSemanticKernelNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/semantic-kernel');

export default function SemanticKernelNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid
        queryKey="semanticKernelNews"
        queryFn={getSemanticKernelNews}
        productIcon={feed.icon}
      />
    </ProductNewsLayout>
  );
}
