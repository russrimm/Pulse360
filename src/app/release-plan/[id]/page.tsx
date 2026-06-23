import { getReleasePlans } from '@/lib/api.server';
import { ReleasePlanDetail } from '@/components/ReleasePlanDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

interface ReleasePlan {
  id: string;
  title: string;
  content: string;
  product: string;
  investmentArea: string;
  businessValue: string;
  enabledFor: string;
  publicPreviewDate: string;
  gaDate: string;
  publicPreviewWave: string;
  gaWave: string;
  published: string;
  lastUpdated: string;
  tags: string[];
  service: string[];
}

export default async function ReleasePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const releasePlans = await getReleasePlans();
  const plan = releasePlans.find((p: ReleasePlan) => p.id === id);

  if (!plan) {
    notFound();
  }

  return <ReleasePlanDetail plan={plan} />;
} 