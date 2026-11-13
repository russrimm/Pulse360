'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getPowerAutomateNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/power-automate');

export default function PowerAutomateNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid
        queryKey="powerAutomateNews"
        queryFn={getPowerAutomateNews}
        productIcon={feed.icon}
      />
    </ProductNewsLayout>
  );
}
