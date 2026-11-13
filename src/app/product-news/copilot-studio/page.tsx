'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getCopilotStudioNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/copilot-studio');

export default function CopilotStudioNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid
        queryKey="copilotStudioNews"
        queryFn={getCopilotStudioNews}
        productIcon={feed.icon}
      />
    </ProductNewsLayout>
  );
}
