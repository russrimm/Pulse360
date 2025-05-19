'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { M365UpdateCard } from '@/components/M365UpdateCard';
import { ProductFilter } from '@/components/ProductFilter';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { addDays, isAfter, isBefore, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';

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

interface M365UpdatesListProps {
  updates: M365Update[];
  searchQuery: string;
}

const ITEMS_PER_PAGE = 12;

export function M365UpdatesList({ updates, searchQuery }: M365UpdatesListProps) {
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [visibleUpdates, setVisibleUpdates] = useState<M365Update[]>([]);
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'last30' | 'last7' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Get unique tags
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    updates.forEach(update => {
      update.tags.forEach(tag => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [updates]);

  // Filter and sort updates
  const filteredUpdates = useMemo(() => {
    return updates
      .filter(update => {
        const matchesSearch = searchQuery === '' || 
          update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          update.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesServices = selectedServices.length === 0 || 
          update.service.some(service => selectedServices.includes(service));
        const matchesTags = selectedTags.length === 0 || 
          update.tags.some(tag => selectedTags.includes(tag));
        // Date filter logic
        let matchesDate = true;
        if (selectedDateFilter === 'last30') {
          matchesDate = isAfter(parseISO(update.published), subDays(new Date(), 30));
        } else if (selectedDateFilter === 'last7') {
          matchesDate = isAfter(parseISO(update.published), subDays(new Date(), 7));
        } else if (selectedDateFilter === 'custom' && customDateRange.from && customDateRange.to) {
          const published = parseISO(update.published);
          matchesDate =
            isAfter(published, startOfDay(parseISO(customDateRange.from))) &&
            isBefore(published, endOfDay(parseISO(customDateRange.to)));
        }
        return matchesSearch && matchesServices && matchesTags && matchesDate;
      })
      .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
  }, [updates, searchQuery, selectedServices, selectedTags, selectedDateFilter, customDateRange]);

  // Handle loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = requestAnimationFrame(() => {
      setIsLoading(false);
    });
    return () => cancelAnimationFrame(timer);
  }, [searchQuery, selectedServices, selectedTags]);

  // Update available services
  useEffect(() => {
    const uniqueServices = Array.from(new Set(updates.flatMap(u => u.service))).sort((a, b) => a.localeCompare(b));
    setServices(uniqueServices);
  }, [updates]);

  // Update visible updates when page changes
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setVisibleUpdates(filteredUpdates.slice(start, end));
  }, [filteredUpdates, page]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleUpdates.length < filteredUpdates.length) {
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
  }, [visibleUpdates.length, filteredUpdates.length]);

  const handleUpdateClick = (updateId: string) => {
    router.push(`/m365-update/${updateId}`);
  };

  if (!updates) return null;

  return (
    <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="sticky top-32 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm pt-0 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="mb-3">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filters</h2>
          <div className="flex flex-wrap gap-4">
            <ProductFilter
              services={services}
              selectedServices={selectedServices}
              onFilterChange={setSelectedServices}
            />
            <div className="relative">
              <button
                onClick={() => setDateFilterOpen(!dateFilterOpen)}
                className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 relative"
                aria-label="Filter by date"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Date</span>
                {selectedDateFilter !== 'all' && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                    1
                  </span>
                )}
              </button>
              {dateFilterOpen && (
                <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter by Date</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedDateFilter === 'all'}
                        onChange={() => setSelectedDateFilter('all')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">All Dates</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedDateFilter === 'last30'}
                        onChange={() => setSelectedDateFilter('last30')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Last 30 days</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedDateFilter === 'last7'}
                        onChange={() => setSelectedDateFilter('last7')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Last 7 days</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedDateFilter === 'custom'}
                        onChange={() => setSelectedDateFilter('custom')}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Custom Range</span>
                    </label>
                    {selectedDateFilter === 'custom' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <input
                          type="date"
                          value={customDateRange.from}
                          onChange={e => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                          className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <input
                          type="date"
                          value={customDateRange.to}
                          onChange={e => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                          className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedDateFilter('all');
                        setCustomDateRange({ from: '', to: '' });
                        setDateFilterOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mb-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredUpdates.length} update{filteredUpdates.length !== 1 ? 's' : ''}
              {filteredUpdates.length !== updates.length && (
                <span className="ml-1">
                  (filtered from {updates.length} total)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {visibleUpdates.map((update) => (
          <M365UpdateCard 
            key={update.id} 
            update={update} 
            onClick={handleUpdateClick}
          />
        ))}
      </div>
      <div ref={loadMoreRef} className="h-10" />
    </div>
  );
} 