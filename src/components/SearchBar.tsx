'use client';

import { useCallback, useState } from 'react';

interface SearchableItem {
  id: string;
  title: string;
  service?: string[];
  product?: string;
}

interface SearchBarProps<T extends SearchableItem> {
  messages: T[];
  onSearch: (filteredMessages: T[]) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar<T extends SearchableItem>({
  messages,
  onSearch,
  searchQuery,
  onSearchQueryChange,
  placeholder = 'Search by title or product…',
}: SearchBarProps<T>) {
  const [uncontrolledSearch, setUncontrolledSearch] = useState('');
  const isControlled = searchQuery !== undefined;
  const currentSearch = isControlled ? searchQuery : uncontrolledSearch;

  const handleSearch = useCallback(
    (value: string) => {
      if (!isControlled) {
        setUncontrolledSearch(value);
      }
      onSearchQueryChange?.(value);

      const normalizedQuery = value.trim().toLowerCase();
      if (!normalizedQuery) {
        onSearch(messages);
        return;
      }

      onSearch(
        messages.filter(
          message =>
            message.id.toLowerCase().includes(normalizedQuery) ||
            message.title.toLowerCase().includes(normalizedQuery) ||
            message.service?.some(service => service.toLowerCase().includes(normalizedQuery)) ||
            message.product?.toLowerCase().includes(normalizedQuery)
        )
      );
    },
    [isControlled, messages, onSearch, onSearchQueryChange]
  );

  return (
    <div className="relative mx-auto mb-8 w-full max-w-2xl">
      <label htmlFor="portal-search" className="sr-only">
        Search updates
      </label>
      <div className="relative">
        <input
          id="portal-search"
          name="portal-search"
          type="search"
          autoComplete="off"
          value={currentSearch}
          onChange={event => handleSearch(event.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full rounded-xl border border-gray-200 bg-white/80 py-3 pl-12 pr-12 text-gray-900 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-gray-500 focus:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:placeholder:text-gray-400"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {currentSearch ? (
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-xl pr-4 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
