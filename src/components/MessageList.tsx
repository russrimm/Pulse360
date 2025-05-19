'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchBar } from '@/components/SearchBar';
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
  }, [messages, searchQuery, selectedServices, selectedTags, selectedDateFilter, customDateRange]);

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
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filters</h2>
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
                    />
                    <span className="text-sm">All Dates</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'last30'}
                      onChange={() => setSelectedDateFilter('last30')}
                    />
                    <span className="text-sm">Last 30 days</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'last7'}
                      onChange={() => setSelectedDateFilter('last7')}
                    />
                    <span className="text-sm">Last 7 days</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'custom'}
                      onChange={() => setSelectedDateFilter('custom')}
                    />
                    <span className="text-sm">Custom Range</span>
                  </label>
                  {selectedDateFilter === 'custom' && (
                    <div className="flex flex-col gap-2 mt-2">
                      <input
                        type="date"
                        value={customDateRange.from}
                        onChange={e => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="date"
                        value={customDateRange.to}
                        onChange={e => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                        className="border rounded px-2 py-1 text-sm"
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
          <div className="relative">
            <button
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 relative"
              aria-label="Filter tags"
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium">Tags</span>
              {selectedTags.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>
            {isTagDropdownOpen && (
              <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Tags</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {uniqueTags.map((tag) => {
                    // Map tags to appropriate icons
                    const getTagIcon = (tag: string) => {
                      const tagLower = tag.toLowerCase();
                      if (tagLower.includes('feature')) return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
                      if (tagLower.includes('security')) return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
                      if (tagLower.includes('update')) return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
                      if (tagLower.includes('deprecation')) return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
                      if (tagLower.includes('new')) return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
                      if (tagLower.includes('change')) return 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4';
                      return 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z';
                    };

                    const getTagStyle = (tag: string) => {
                      const tagLower = tag.toLowerCase();
                      if (tagLower.includes('new feature')) return 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200/30 dark:border-emerald-700/20';
                      if (tagLower.includes('update')) return 'bg-teal-50/90 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200 border border-teal-200/30 dark:border-teal-700/20';
                      if (tagLower.includes('user impact')) return 'bg-amber-50/90 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200/30 dark:border-amber-700/20';
                      if (tagLower.includes('admin impact')) return 'bg-orange-50/90 text-orange-700 dark:bg-orange-900/20 dark:text-orange-200 border border-orange-200/30 dark:border-orange-700/20';
                      return 'bg-gray-50/90 text-gray-600 dark:bg-gray-800/20 dark:text-gray-300 border border-gray-200/30 dark:border-gray-700/20';
                    };

                    const getTagText = (tag: string) => {
                      const tagLower = tag.toLowerCase();
                      if (tagLower.includes('new feature')) return 'New';
                      if (tagLower.includes('update')) return 'Updated';
                      return tag;
                    };

                    return (
                      <label
                        key={tag}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags([...selectedTags, tag]);
                            } else {
                              setSelectedTags(selectedTags.filter(t => t !== tag));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className={`ml-2 inline-flex items-center px-1.5 py-[1px] rounded-full text-[9px] font-medium tracking-wide whitespace-nowrap shrink-0 shadow-sm ${getTagStyle(tag)}`}>
                          <svg
                            className="w-2 h-2 mr-0.5 text-current opacity-70"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={getTagIcon(tag)}
                            />
                          </svg>
                          {getTagText(tag)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      setIsTagDropdownOpen(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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