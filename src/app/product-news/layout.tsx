import { Metadata } from 'next';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';

export const metadata: Metadata = {
  title: 'Pulse 360 | Product News',
  description:
    'Stay up to date with the latest news and announcements from Microsoft Power Platform products.',
};

export default function ProductNewsLayout({ children }: { children: React.ReactNode }) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
