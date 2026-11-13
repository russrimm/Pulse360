import { productNewsMetadata } from '@/lib/product-news';

export const metadata = productNewsMetadata('/product-news/power-automate');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
