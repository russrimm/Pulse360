'use client';

import { useState } from 'react';
import { M365UpdatesList } from '@/components/M365UpdatesList';
import { SearchBar } from '@/components/SearchBar';

interface M365Update {
  id: string;
  title: string;
  content: string;
  product: string;
  status: string;
  published: string;
  lastUpdated: string;
  tags: string[];
  service: string[];
  generalAvailabilityDate: string;
  previewAvailabilityDate: string;
  cloudInstances: string[];
  platforms: string[];
  releaseRings: string[];
}

interface M365UpdatesContentProps {
  updates: M365Update[];
}

export function M365UpdatesContent({ updates }: M365UpdatesContentProps) {
  const [filteredUpdates, setFilteredUpdates] = useState<M365Update[]>(updates);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <SearchBar messages={updates} onSearch={setFilteredUpdates} />
        </div>
      </div>
      <M365UpdatesList updates={filteredUpdates} searchQuery="" />
    </div>
  );
} 