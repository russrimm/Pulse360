import { getReleasePlans } from '@/lib/api';
import { ReleasePlanDetail } from '@/components/ReleasePlanDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ReleasePlanPage({ params }: PageProps) {
  const releasePlans = await getReleasePlans();
  const plan = releasePlans.find(p => p.id === params.id);

  if (!plan) {
    return notFound();
  }

  return <ReleasePlanDetail plan={plan} />;
} 