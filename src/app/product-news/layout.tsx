import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product News | MCViewer',
  description: 'Stay up to date with the latest news and announcements from Microsoft Power Platform products.',
};

export default function ProductNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 