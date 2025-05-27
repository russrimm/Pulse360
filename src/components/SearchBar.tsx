import React, { useState, useMemo, useCallback } from 'react';
import { Message } from '@/lib/types';

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
  placeholder
}: SearchBarProps<T>) {
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
    
    if (!value.trim()) {
      onSearch(messages);
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = messages.filter(message => 
      message.id.toLowerCase().includes(searchLower) ||
      message.title.toLowerCase().includes(searchLower) ||
      (message.service?.some(service => service.toLowerCase().includes(searchLower)) || false) ||
      (message.product?.toLowerCase().includes(searchLower) || false)
    );
    
    onSearch(filtered);
  }, [messages, onSearch, onSearchQueryChange]);

  const clearSearch = useCallback(() => {
    handleSearch('');
  }, [handleSearch]);

  const searchInputProps = useMemo(() => ({
    type: "text",
    value: searchTerm,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value),
    placeholder: placeholder || "Search by Title or Product...",
    className: "w-full px-4 py-3 pl-12 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200",
    spellCheck: false
  }), [searchTerm, handleSearch, placeholder]);

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <input {...searchInputProps} />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 