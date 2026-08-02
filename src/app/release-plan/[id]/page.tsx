import { getReleasePlans } from '@/lib/api.server';
import { ReleasePlanDetail } from '@/components/ReleasePlanDetail';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { buildDetailMetadata, buildMissingDetailMetadata } from '@/lib/detailMetadata';

interface ReleasePlanPageProps {
  params: Promise<{ id: string }>;
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

const getCachedReleasePlans = cache(getReleasePlans);

export async function generateMetadata({ params }: ReleasePlanPageProps): Promise<Metadata> {
  const { id } = await params;
  const plan = (await getCachedReleasePlans()).find((item: ReleasePlan) => item.id === id);
  if (!plan) return buildMissingDetailMetadata('Release plan');

  return buildDetailMetadata({
    title: plan.title,
    description: plan.content || plan.businessValue,
    canonicalPath: `/release-plan/${id}`,
  });
}

export default async function ReleasePlanPage({ params }: ReleasePlanPageProps) {
  const { id } = await params;
  const releasePlans = await getCachedReleasePlans();
  const plan = releasePlans.find((p: ReleasePlan) => p.id === id);

  if (!plan) {
    notFound();
  }

  return <ReleasePlanDetail plan={plan} />;
} 