'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ReleasePlanCard } from '@/components/ReleasePlanCard';
import { ProductFilter } from '@/components/ProductFilter';
import { AreaFilter } from '@/components/AreaFilter';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { addDays, isAfter, isBefore, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';

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

interface ReleasePlansListProps {
  releasePlans: ReleasePlan[];
  hideFilters?: boolean;
  drillthroughBasePath?: string;
}

const ITEMS_PER_PAGE = 12;

export function ReleasePlansList({ releasePlans, hideFilters, drillthroughBasePath = '/release-plan' }: ReleasePlansListProps) {
  const router = useRouter();
  const [visibleReleasePlans, setVisibleReleasePlans] = useState<ReleasePlan[]>([]);
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update visible release plans when page changes
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setVisibleReleasePlans(releasePlans.slice(start, end));
  }, [releasePlans, page]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleReleasePlans.length < releasePlans.length) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleReleasePlans.length, releasePlans.length]);

  const handleReleasePlanClick = (planId: string) => {
    router.push(`${drillthroughBasePath}/${planId}`);
  };

  if (!releasePlans) return null;

  return (
    <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {visibleReleasePlans.map((plan) => (
          <ReleasePlanCard key={plan.id} plan={plan} onClick={handleReleasePlanClick} drillthroughBasePath={drillthroughBasePath} />
        ))}
      </div>
      <div ref={loadMoreRef} />
    </div>
  );
} 