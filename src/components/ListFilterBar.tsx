'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProductFilter } from '@/components/ProductFilter';
import { DATE_FILTER_OPTIONS, type DateFilterValue, type ListFacetResult } from '@/lib/list-query';

interface ListFilterBarProps {
  query: string;
  date: DateFilterValue;
  from: string;
  to: string;
  facets: ListFacetResult[];
  filteredCount: number;
  totalCount: number;
  noun?: string;
  searchPlaceholder?: string;
  /** Lets a page hide the date filter when its items have no meaningful date. */
  showDateFilter?: boolean;
}

const filterButtonClass =
  'relative flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-line-strong hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-auto';
const filterButtonActiveClass = 'border-accent/40 bg-accent-soft text-accent-ink';
const SEARCH_DEBOUNCE_MS = 300;

/**
 * URL-driven filter bar: every control writes to the query string so the
 * server can filter and paginate, and filtered views survive reload, Back,
 * and sharing. Changing any filter resets pagination.
 */
export function ListFilterBar({
  query,
  date,
  from,
  to,
  facets,
  filteredCount,
  totalCount,
  noun = 'update',
  searchPlaceholder = 'Search titles, products, or tags…',
  showDateFilter = true,
}: ListFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const lastCommittedQuery = useRef(query);

  function commit(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete('page');
    const queryString = next.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  // Keep the input in sync when the URL changes from outside (Back, Clear all).
  useEffect(() => {
    if (query !== lastCommittedQuery.current) {
      lastCommittedQuery.current = query;
      setSearchValue(query);
    }
  }, [query]);

  useEffect(() => {
    if (searchValue.trim() === query.trim()) return;
    const timer = setTimeout(() => {
      lastCommittedQuery.current = searchValue;
      commit(next => {
        if (searchValue.trim()) next.set('q', searchValue.trim());
        else next.delete('q');
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // commit is recreated each render; the inputs that matter are listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, query]);

  useEffect(() => {
    if (openMenu !== 'date') return;
    const onPointerDown = (event: MouseEvent) => {
      if (!dateMenuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const hasActiveFilters =
    query.trim().length > 0 || date !== 'all' || facets.some(facet => facet.selected.length > 0);

  function setFacet(key: string, values: string[]) {
    commit(next => {
      next.delete(key);
      for (const value of values) next.append(key, value);
    });
  }

  function setDate(value: DateFilterValue) {
    commit(next => {
      if (value === 'all') next.delete('date');
      else next.set('date', value);
      if (value !== 'custom') {
        next.delete('from');
        next.delete('to');
      }
    });
  }

  function setCustomBound(key: 'from' | 'to', value: string) {
    commit(next => {
      next.set('date', 'custom');
      if (value) next.set(key, value);
      else next.delete(key);
    });
  }

  function clearAll() {
    setSearchValue('');
    lastCommittedQuery.current = '';
    setOpenMenu(null);
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  const countLabel =
    filteredCount === totalCount
      ? `${totalCount.toLocaleString('en-US')} ${noun}${totalCount === 1 ? '' : 's'}`
      : `${filteredCount.toLocaleString('en-US')} of ${totalCount.toLocaleString('en-US')} ${noun}s`;

  return (
    <div
      className="sticky top-[var(--app-header-h,6.5rem)] z-40 -mx-4 mb-3 border-b border-line bg-canvas/90 px-4 py-2.5 backdrop-blur-md"
      aria-busy={isPending}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full md:w-72">
          <label htmlFor="list-search" className="sr-only">
            Search {noun}s
          </label>
          <input
            id="list-search"
            type="search"
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>

        {facets.map(facet => (
          <div key={facet.key} className="w-full md:w-auto">
            <ProductFilter
              services={facet.options}
              selectedServices={facet.selected}
              onFilterChange={values => setFacet(facet.key, values)}
              isOpen={openMenu === facet.key}
              setOpen={open => setOpenMenu(open ? facet.key : null)}
              label={facet.label}
            />
          </div>
        ))}

        {showDateFilter ? (
          <div className="relative w-full md:w-auto" ref={dateMenuRef}>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'date' ? null : 'date')}
              className={`${filterButtonClass}${date !== 'all' ? ` ${filterButtonActiveClass}` : ''}`}
              aria-expanded={openMenu === 'date'}
              aria-haspopup="dialog"
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
              <span>
                {date === 'all'
                  ? 'Date'
                  : (DATE_FILTER_OPTIONS.find(option => option.value === date)?.label ?? 'Date')}
              </span>
            </button>
            {openMenu === 'date' ? (
              <div
                role="dialog"
                aria-label="Date filter options"
                className="animate-fadein absolute z-50 mt-2 w-72 rounded-xl border border-line bg-surface-raised shadow-xl"
              >
                <fieldset className="flex flex-col gap-2 p-4">
                  <legend className="type-body-sm mb-2 font-semibold text-ink">Filter by date</legend>
                  {DATE_FILTER_OPTIONS.map(option => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="list-date-filter"
                        checked={date === option.value}
                        onChange={() => setDate(option.value)}
                        className="accent-[var(--c-accent)]"
                      />
                      <span className="type-body-sm text-ink">{option.label}</span>
                    </label>
                  ))}
                  {date === 'custom' ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <label className="type-meta flex flex-col gap-1 text-ink-muted">
                        From
                        <input
                          type="date"
                          value={from}
                          onChange={event => setCustomBound('from', event.target.value)}
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                        />
                      </label>
                      <label className="type-meta flex flex-col gap-1 text-ink-muted">
                        To
                        <input
                          type="date"
                          value={to}
                          onChange={event => setCustomBound('to', event.target.value)}
                          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                        />
                      </label>
                    </div>
                  ) : null}
                </fieldset>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="min-h-9 rounded-lg px-3 text-sm font-medium text-accent-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Clear all
          </button>
        ) : null}

        <p className="type-meta ml-auto text-ink-subtle" aria-live="polite">
          {countLabel}
        </p>
      </div>
    </div>
  );
}
