'use client';

import { useState } from 'react';
import { ReleasePlansList } from '@/components/ReleasePlansList';
import { SearchBar } from '@/components/SearchBar';

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

interface ReleasePlansContentProps {
  releasePlans: ReleasePlan[];
}

export function ReleasePlansContent({ releasePlans }: ReleasePlansContentProps) {
  const [filteredReleasePlans, setFilteredReleasePlans] = useState<ReleasePlan[]>(releasePlans);

  return (
    <>
      <SearchBar messages={releasePlans} onSearch={setFilteredReleasePlans} />
      <ReleasePlansList releasePlans={filteredReleasePlans} />
    </>
  );
} 