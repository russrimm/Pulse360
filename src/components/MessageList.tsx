'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';
import { TagsFilter } from '@/components/TagsFilter';
import { endOfDay, isAfter, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns';
import { useFilterContext } from './FilterContext';
import { matchesMessageSearch } from '@/lib/messageSearch';

interface MessageListProps {
  messages: Message[];
}

const ITEMS_PER_PAGE = 12;

export function MessageList({ messages: messagesProp }: MessageListProps) {
  const messages = messagesProp;
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const isSearchPending = searchQuery.trim().toLowerCase() !== deferredSearchQuery;

  // Shared filter state
  const {
    selectedTags,
    setSelectedTags,
    selectedServices,
    setSelectedServices,
    openFilter,
    setOpenFilter,
    selectedDateFilter,
    setSelectedDateFilter,
    customDateRange,
    setCustomDateRange,
    showMajorChangesOnly,
    setShowMajorChangesOnly,
  } = useFilterContext();

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    const MAINTENANCE_PHRASE =
      'We have scheduled your Power Platform environment for planned service maintenance.';
    return messages
      .filter(message => message.id !== 'MC1085084')
      .filter(message => message.title !== 'Power Platform - Planned maintenance')
      .filter(
        message =>
          !message.content.includes(MAINTENANCE_PHRASE) &&
          !message.title.includes(MAINTENANCE_PHRASE)
      )
      .filter(message => {
        const matchesSearch = matchesMessageSearch(message, deferredSearchQuery);
        const matchesServices =
          selectedServices.length === 0 ||
          message.service.some(service => selectedServices.includes(service));
        const matchesTags =
          selectedTags.length === 0 || message.tags.some(tag => selectedTags.includes(tag));
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
          matchesDate = isWithinInterval(lastUpdated, {
            start: startOfDay(parseISO(customDateRange.from)),
            end: endOfDay(parseISO(customDateRange.to)),
          });
        }
        return matchesSearch && matchesServices && matchesTags && matchesDate;
      })
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [
    messages,
    deferredSearchQuery,
    selectedServices,
    selectedTags,
    showMajorChangesOnly,
    selectedDateFilter,
    customDateRange,
  ]);

  // Derive services synchronously — no useEffect flash
  const services = useMemo(
    () => Array.from(new Set(messages.flatMap(m => m.service))).sort((a, b) => a.localeCompare(b)),
    [messages]
  );

  // Update available tags only if necessary
  useEffect(() => {
    const uniqueTags = Array.from(new Set(messages.flatMap(m => m.tags))).sort((a, b) =>
      a.localeCompare(b)
    );
    // Only reset selectedTags if any selected tag is no longer available
    if (selectedTags.some(tag => !uniqueTags.includes(tag))) {
      setSelectedTags(selectedTags.filter(tag => uniqueTags.includes(tag)));
    }
    // Do NOT reset selectedTags on every messages change
  }, [messages, selectedTags, setSelectedTags]);

  const visibleMessages = filteredMessages.slice(0, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [
    deferredSearchQuery,
    selectedServices,
    selectedTags,
    selectedDateFilter,
    customDateRange,
    showMajorChangesOnly,
  ]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && page * ITEMS_PER_PAGE < filteredMessages.length) {
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
  }, [page, filteredMessages.length]);

  return (
    <div className="relative">
      <div className="mx-auto mb-6 mt-8 w-full max-w-2xl">
        <label htmlFor="message-search" className="sr-only">
          Search Message Center updates
        </label>
        <input
          id="message-search"
          name="message-search"
          type="search"
          autoComplete="off"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="Search titles, content, services, tags, or ID…"
          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-gray-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-gray-500 focus:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:placeholder:text-gray-400"
        />
        <p
          id="message-results-status"
          className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
          aria-live="polite"
        >
          {isSearchPending
            ? 'Updating results…'
            : `${filteredMessages.length} result${filteredMessages.length === 1 ? '' : 's'}`}
        </p>
      </div>{' '}
      <div className="relative md:sticky md:top-28 z-40 backdrop-blur-md pt-0 pb-0 border-b border-gray-200/50 dark:border-gray-700/50 mt-6">
        <div className="mb-2">
          <div className="flex flex-wrap items-center mb-2 gap-2">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              Filters
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400 font-normal">
                (Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                {filteredMessages.length !== messages.length &&
                  `, filtered from ${messages.length} total`}
                )
              </span>
            </h2>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 w-full">
            <div className="w-full md:w-auto">
              <ProductFilter
                services={services}
                selectedServices={selectedServices}
                onFilterChange={setSelectedServices}
                isOpen={openFilter === 'product'}
                setOpen={open => setOpenFilter(open ? 'product' : null)}
              />
            </div>
            <div className="w-full md:w-auto">
              <TagsFilter messages={messages} />
            </div>
            <div className="relative w-full md:w-auto">
              <button
                onClick={() => setOpenFilter(openFilter === 'date' ? null : 'date')}
                className="flex items-center justify-center gap-2 px-4 min-h-[32px] w-full md:w-auto text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 relative"
                aria-label="Filter by date"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {openFilter === 'date' && (
                <div
                  className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Filter by Date
                    </h3>
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
                          <label
                            htmlFor="date-from"
                            className="text-sm text-gray-700 dark:text-gray-200"
                          >
                            From
                          </label>
                          <input
                            id="date-from"
                            type="date"
                            value={customDateRange.from}
                            onChange={e =>
                              setCustomDateRange({ ...customDateRange, from: e.target.value })
                            }
                            className="border rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="date-to"
                            className="text-sm text-gray-700 dark:text-gray-200"
                          >
                            To
                          </label>
                          <input
                            id="date-to"
                            type="date"
                            value={customDateRange.to}
                            onChange={e =>
                              setCustomDateRange({ ...customDateRange, to: e.target.value })
                            }
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
                        setOpenFilter(null);
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
                onClick={() => {
                  setOpenFilter(null);
                  setShowMajorChangesOnly(!showMajorChangesOnly);
                }}
                className={`flex items-center justify-center gap-2 px-4 min-h-[32px] w-full md:w-auto text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 relative ${showMajorChangesOnly ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 animate-pulse-slow' : ''}`}
                aria-label="Filter major changes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-sm font-medium">Major Changes</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full opacity-0">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {visibleMessages.map(message => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
      {filteredMessages.length === 0 ? (
        <p className="py-12 text-center text-gray-600 dark:text-gray-400" role="status">
          No Message Center updates match these filters.
        </p>
      ) : null}
      {visibleMessages.length < filteredMessages.length ? (
        <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center py-4">
          <button
            type="button"
            onClick={() => setPage(currentPage => currentPage + 1)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}
