'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getPowerPlatformNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/power-platform');

export default function PowerPlatformNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid
        queryKey="powerPlatformNews"
        queryFn={getPowerPlatformNews}
        productIcon={feed.icon}
      />
    </ProductNewsLayout>
  );
}
