'use client';

import { useState, useMemo } from 'react';
import { AzureUpdate } from '@/lib/types';
import { AzureUpdatesContent } from './AzureUpdatesContent';
import { SearchBar } from './SearchBar';

interface AzureUpdatesClientProps {
  initialUpdates: AzureUpdate[];
}

export function AzureUpdatesClient({ initialUpdates }: AzureUpdatesClientProps) {
  const [updates] = useState<AzureUpdate[]>(initialUpdates);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter updates based on search query
  const filteredUpdates = useMemo(() => {
    if (!searchQuery.trim()) {
      return updates;
    }

    const query = searchQuery.toLowerCase();
    return updates.filter(update => 
      update.title.toLowerCase().includes(query) ||
      update.description.toLowerCase().includes(query) ||
      update.products.some(product => product.toLowerCase().includes(query)) ||
      update.productCategories.some(category => category.toLowerCase().includes(query)) ||
      update.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [updates, searchQuery]);

  const handleSearch = (filteredMessages: AzureUpdate[]) => {
    // The search is now handled by the searchQuery state
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Azure Updates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay informed about the latest Azure updates and changes.
          </p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-2xl">
            <SearchBar 
              messages={updates} 
              onSearch={handleSearch}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </div>
        </div>
        <AzureUpdatesContent updates={filteredUpdates} searchQuery={searchQuery} />
      </div>
    </div>
  );
} 