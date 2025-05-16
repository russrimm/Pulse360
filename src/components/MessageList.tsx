'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchBar } from '@/components/SearchBar';

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

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
        
        return matchesSearch && matchesServices && matchesTags;
      })
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }, [messages, searchQuery, selectedServices, selectedTags]);

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

  useEffect(() => {
    // Simulate loading time for messages
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Get unique products and tags
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    messages.forEach(message => {
      message.service.forEach(service => {
        products.add(service);
      });
    });
    return Array.from(products).sort();
  }, [messages]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    messages.forEach(message => {
      message.tags.forEach(tag => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [messages]);

  const handleMessageClick = (messageId: string) => {
    router.push(`/message/${messageId}`);
  };

  if (!messages) return null;

  return (
    <div className="relative">
      {isLoading && <LoadingSpinner />}
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
                  {uniqueTags.map((tag) => (
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
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{tag}</span>
                    </label>
                  ))}
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