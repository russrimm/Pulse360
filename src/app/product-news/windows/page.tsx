'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { fetchProxiedFeed } from '@/lib/feed/client-parse';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/windows');

function getWindowsNews() {
  return fetchProxiedFeed('https://blogs.windows.com/feed/', 'Windows blog', 'Windows Blog Team');
}

export default function WindowsNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid queryKey="windowsNews" queryFn={getWindowsNews} productIcon={feed.icon} />
    </ProductNewsLayout>
  );
}
