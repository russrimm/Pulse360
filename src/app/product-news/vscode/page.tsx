'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { ProductNewsLayout } from '@/components/ProductNewsLayout';
import { fetchProxiedFeed } from '@/lib/feed/client-parse';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/vscode');

function getVSCodeNews() {
  return fetchProxiedFeed(
    'https://code.visualstudio.com/feed.xml',
    'VS Code blog',
    'Visual Studio Code Team'
  );
}

export default function VSCodeNewsPage() {
  return (
    <ProductNewsLayout title={feed.title} description={feed.description} icon={feed.icon}>
      <FeedQueryGrid queryKey="vscodeNews" queryFn={getVSCodeNews} productIcon={feed.icon} />
    </ProductNewsLayout>
  );
}
