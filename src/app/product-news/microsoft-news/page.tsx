'use client';

import { FeedQueryGrid } from '@/components/FeedGrid';
import { MicrosoftMark, ProductNewsLayout } from '@/components/ProductNewsLayout';
import { getMicrosoftNews } from '@/lib/api.client';
import { getProductNewsFeed } from '@/lib/product-news';

const feed = getProductNewsFeed('/product-news/microsoft-news');

export default function MicrosoftNewsPage() {
  return (
    <ProductNewsLayout
      title={feed.title}
      description={feed.description}
      icon={<MicrosoftMark size={32} />}
    >
      <FeedQueryGrid queryKey="microsoftNews" queryFn={getMicrosoftNews} />
    </ProductNewsLayout>
  );
}
