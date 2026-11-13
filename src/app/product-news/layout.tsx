import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import { productNewsMetadata } from '@/lib/product-news';

// The index route renders the first feed (Power Apps); every other feed route
// sets its own title through a per-route layout.
export const metadata = productNewsMetadata('/product-news');

export default function ProductNewsLayout({ children }: { children: React.ReactNode }) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
