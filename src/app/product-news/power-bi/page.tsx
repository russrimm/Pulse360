'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getPowerBINews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/power-bi');

export default function PowerBINewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid queryKey="powerBINews" queryFn={getPowerBINews} productIcon={feed.icon} />
    </ProductNewsLayout>
  );
}
