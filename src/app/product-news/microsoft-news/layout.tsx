import { productNewsMetadata } from '@/lib/product-news';

export const metadata = productNewsMetadata('/product-news/microsoft-news');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
