'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchBar } from '@/components/SearchBar';
import { TagsFilter } from '@/components/TagsFilter';
import { addDays, isAfter, isBefore, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';

interface MessageListProps {
  messages: Message[];
}

const ITEMS_PER_PAGE = 12;

export function MessageList({ messages }: MessageListProps) {
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'last30' | 'last7' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showMajorChangesOnly, setShowMajorChangesOnly] = useState(false);

  // Get unique tags
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    messages.forEach(message => {
      message.tags.forEach(tag => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [messages]);

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    return messages
      .filter(message => {
        const matchesSearch = searchQuery === '' || 
          message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesServices = selectedServices.length === 0 || 
          message.service.some(service => selectedServices.includes(service));
        const matchesTags = selectedTags.length === 0 || 
          message.tags.some(tag => selectedTags.includes(tag));
        // Major changes filter
        if (showMajorChangesOnly && !message.isMajorChange) {
          return false;
        }
        // Date filter logic
        let matchesDate = true;
        if (selectedDateFilter === 'last30') {
          matchesDate = isAfter(parseISO(message.lastUpdated), subDays(new Date(), 30));
        } else if (selectedDateFilter === 'last7') {
          matchesDate = isAfter(parseISO(message.lastUpdated), subDays(new Date(), 7));
        } else if (selectedDateFilter === 'custom' && customDateRange.from && customDateRange.to) {
          const lastUpdated = parseISO(message.lastUpdated);
          matchesDate =
            isAfter(lastUpdated, startOfDay(parseISO(customDateRange.from))) &&
            isBefore(lastUpdated, endOfDay(parseISO(customDateRange.to)));
        }
        return matchesSearch && matchesServices && matchesTags && matchesDate;
      })
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [messages, searchQuery, selectedServices, selectedTags, showMajorChangesOnly, selectedDateFilter, customDateRange]);

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
    const uniqueServices = Array.from(new Set(messages.flatMap(m => m.service))).sort((a, b) => a.localeCompare(b));
    setServices(uniqueServices);
  }, [messages]);

  // Update available tags
  useEffect(() => {
    const uniqueTags = Array.from(new Set(messages.flatMap(m => m.tags))).sort((a, b) => a.localeCompare(b));
    setSelectedTags([]);
  }, [messages]);

  // Update visible messages when page changes
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setVisibleMessages(filteredMessages.slice(start, end));
  }, [filteredMessages, page]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleMessages.length < filteredMessages.length) {
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
  }, [visibleMessages.length, filteredMessages.length]);

  const handleMessageClick = (messageId: string) => {
    router.push(`/message/${messageId}`);
  };

  if (!messages) return null;

  return (
    <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="relative md:sticky md:top-28 z-40 backdrop-blur-md pt-0 pb-0 border-b border-gray-200/50 dark:border-gray-700/50 mt-20">
        <div className="mb-2">
          <div className="flex flex-wrap items-center mb-2 gap-2">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              Filters
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400 font-normal">
                (Showing {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                {filteredMessages.length !== messages.length && `, filtered from ${messages.length} total`})
              </span>
            </h2>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 w-full">
            <div className="w-full md:w-auto">
              <ProductFilter
                services={services}
                selectedServices={selectedServices}
                onFilterChange={setSelectedServices}
              />
            </div>
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setDateFilterOpen(!dateFilterOpen)}
                className="flex items-center justify-center gap-2 px-4 min-h-[32px] w-full md:w-auto text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative"
                aria-label="Filter by date"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
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
                        <div className="flex flex-col gap-1">
                          <label htmlFor="date-from" className="text-sm text-gray-700 dark:text-gray-200">From</label>
                          <input
                            id="date-from"
                            type="date"
                            value={customDateRange.from}
                            onChange={e => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                            className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="date-to" className="text-sm text-gray-700 dark:text-gray-200">To</label>
                          <input
                            id="date-to"
                            type="date"
                            value={customDateRange.to}
                            onChange={e => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                            className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
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
            <div className="w-full md:w-auto">
              <button
                onClick={() => setShowMajorChangesOnly(!showMajorChangesOnly)}
                className={`flex items-center justify-center gap-2 px-4 min-h-[32px] w-full md:w-auto text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative ${showMajorChangesOnly ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 animate-pulse-slow' : ''}`}
                aria-label="Filter major changes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">Major Changes</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full opacity-0">
                  0
                </span>
              </button>
            </div>
            <div className="w-full md:w-auto">
              <TagsFilter
                messages={messages}
                selectedTags={selectedTags}
                onFilterChange={setSelectedTags}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {visibleMessages.map((message) => (
          <MessageCard 
            key={message.id} 
            message={message} 
            onClick={handleMessageClick}
          />
        ))}
      </div>
      <div ref={loadMoreRef} className="h-10" />
    </div>
  );
} 