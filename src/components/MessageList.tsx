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

const filterButtonClass =
  'relative flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-line-strong hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-auto';
const filterButtonActiveClass =
  'border-critical/40 bg-critical-soft text-critical-ink hover:bg-critical-soft';

export function MessageList({ messages: messagesProp }: MessageListProps) {
  const messages = messagesProp;
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
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
    searchQuery,
    setSearchQuery,
  } = useFilterContext();
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const isSearchPending = searchQuery.trim().toLowerCase() !== deferredSearchQuery;

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
      <div className="sticky top-[var(--app-header-h,6.5rem)] z-40 -mx-4 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <div className="min-w-0 md:flex-1">
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
              className="min-h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-sm transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

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
              type="button"
              onClick={() => setOpenFilter(openFilter === 'date' ? null : 'date')}
              className={filterButtonClass}
              aria-label="Filter by date"
              aria-expanded={openFilter === 'date'}
            >
              <svg
                className="h-4 w-4 text-ink-subtle"
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
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                  1
                </span>
              )}
            </button>
            {openFilter === 'date' && (
              <div
                className="absolute z-10 mt-2 w-72 rounded-xl border border-line bg-surface-raised shadow-xl"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <div className="border-b border-line p-4">
                  <h3 className="type-body-sm font-semibold text-ink">Filter by date</h3>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'all'}
                      onChange={() => setSelectedDateFilter('all')}
                      className="accent-[var(--c-accent)]"
                    />
                    <span className="type-body-sm text-ink">All dates</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'last30'}
                      onChange={() => setSelectedDateFilter('last30')}
                      className="accent-[var(--c-accent)]"
                    />
                    <span className="type-body-sm text-ink">Last 30 days</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'last7'}
                      onChange={() => setSelectedDateFilter('last7')}
                      className="accent-[var(--c-accent)]"
                    />
                    <span className="type-body-sm text-ink">Last 7 days</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedDateFilter === 'custom'}
                      onChange={() => setSelectedDateFilter('custom')}
                      className="accent-[var(--c-accent)]"
                    />
                    <span className="type-body-sm text-ink">Custom range</span>
                  </label>
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
                          className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                          className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-line p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateFilter('all');
                      setCustomDateRange({ from: '', to: '' });
                      setOpenFilter(null);
                    }}
                    className="type-body-sm w-full rounded-md px-3 py-2 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setOpenFilter(null);
                setShowMajorChangesOnly(!showMajorChangesOnly);
              }}
              aria-pressed={showMajorChangesOnly}
              className={`${filterButtonClass} ${showMajorChangesOnly ? filterButtonActiveClass : ''}`}
              aria-label="Filter major changes"
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Major changes</span>
            </button>
          </div>
        </div>

        <p
          id="message-results-status"
          className="type-meta mt-2 text-ink-subtle"
          aria-live="polite"
        >
          {isSearchPending
            ? 'Updating results…'
            : `${filteredMessages.length.toLocaleString()} of ${messages.length.toLocaleString()} update${messages.length === 1 ? '' : 's'}`}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleMessages.map(message => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
      {filteredMessages.length === 0 ? (
        <div className="py-16 text-center" role="status">
          <p className="type-h3 text-ink">No updates match these filters</p>
          <p className="type-body-sm mt-2 text-ink-muted">
            Try clearing a filter or broadening the date range.
          </p>
        </div>
      ) : null}
      {visibleMessages.length < filteredMessages.length ? (
        <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center py-4">
          <button
            type="button"
            onClick={() => setPage(currentPage => currentPage + 1)}
            className="type-body-sm rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}
