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

const filterButtonClass =
  'relative flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-line-strong hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-auto';
const filterButtonActiveClass =
  'border-critical/40 bg-critical-soft text-critical-ink hover:bg-critical-soft';

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
  // Replace openFilter/setOpenFilter for date with local state
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'last30' | 'last14' | 'last7' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  // Add local state for Products filter dropdown
  const [isProductOpen, setIsProductOpen] = useState(false);

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
        } else if (selectedDateFilter === 'last14') {
          matchesDate = isAfter(parseISO(update.published), subDays(new Date(), 14));
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

  if (!updates) return null;

  return (
    <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="sticky top-[var(--app-header-h,6.5rem)] z-40 -mx-4 mb-3 border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full md:w-auto">
            <ProductFilter
              services={services}
              selectedServices={selectedServices}
              onFilterChange={setSelectedServices}
              isOpen={isProductOpen}
              setOpen={open => {
                setIsProductOpen(open);
                if (open) setIsDateOpen(false);
              }}
            />
          </div>
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => {
                setIsDateOpen(!isDateOpen);
                if (!isDateOpen) setIsProductOpen(false);
              }}
              className={`${filterButtonClass}${selectedDateFilter !== 'all' ? ` ${filterButtonActiveClass}` : ''}`}
              aria-label="Filter by date"
              aria-expanded={isDateOpen}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Date</span>
              {selectedDateFilter !== 'all' && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
                  1
                </span>
              )}
            </button>
            {isDateOpen && (
              <div className="animate-fadein absolute z-50 mt-2 w-72 rounded-xl border border-line bg-surface-raised shadow-xl">
                <div className="border-b border-line px-4 py-3">
                  <h3 className="type-h3 text-ink">Filter by date</h3>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {(
                    [
                      ['all', 'All dates'],
                      ['last30', 'Last 30 days'],
                      ['last14', 'Last 14 days'],
                      ['last7', 'Last 7 days'],
                      ['custom', 'Custom range'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="m365-date-filter"
                        checked={selectedDateFilter === value}
                        onChange={() => setSelectedDateFilter(value)}
                        className="accent-[var(--c-accent)]"
                      />
                      <span className="type-body-sm text-ink">{label}</span>
                    </label>
                  ))}
                  {selectedDateFilter === 'custom' && (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="date-from" className="type-meta text-ink-muted">
                          From
                        </label>
                        <input
                          id="date-from"
                          type="date"
                          value={customDateRange.from}
                          onChange={e =>
                            setCustomDateRange({ ...customDateRange, from: e.target.value })
                          }
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="date-to" className="type-meta text-ink-muted">
                          To
                        </label>
                        <input
                          id="date-to"
                          type="date"
                          value={customDateRange.to}
                          onChange={e =>
                            setCustomDateRange({ ...customDateRange, to: e.target.value })
                          }
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-line p-3">
                  <button
                    onClick={() => {
                      setSelectedDateFilter('all');
                      setCustomDateRange({ from: '', to: '' });
                      setIsDateOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="type-meta ml-auto text-ink-subtle" aria-live="polite">
            {filteredUpdates.length} update{filteredUpdates.length !== 1 ? 's' : ''}
            {filteredUpdates.length !== updates.length ? ` of ${updates.length}` : ''}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleUpdates.map((update) => (
          <M365UpdateCard
            key={update.id}
            update={update}
            onClick={(id) => router.push(`/m365-update/${id}`)}
          />
        ))}
      </div>
      <div ref={loadMoreRef} className="h-10" />
    </div>
  );
}