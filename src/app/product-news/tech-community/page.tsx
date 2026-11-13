'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getTechCommunityNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/tech-community');

export default function TechCommunityNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid
        queryKey="techCommunityNews"
        queryFn={getTechCommunityNews}
        productIcon={feed.icon}
      />
    </ProductNewsLayout>
  );
}
