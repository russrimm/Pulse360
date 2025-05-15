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
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(messages);
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

  // Initialize filtered messages and services
  useEffect(() => {
    if (!messages) return;
    
    const filtered = messages.filter(message => {
      const matchesSearch = message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesServices = selectedServices.length === 0 || 
        message.service.some(service => selectedServices.includes(service));
      const matchesTags = selectedTags.length === 0 || 
        message.tags.some(tag => selectedTags.includes(tag));
      return matchesSearch && matchesServices && matchesTags;
    });
    
    setFilteredMessages(filtered);
    const uniqueServices = Array.from(new Set(messages.flatMap(m => m.service))).sort((a, b) => a.localeCompare(b));
    setServices(uniqueServices);
  }, [messages, searchQuery, selectedServices, selectedTags]);

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
        <div className="flex flex-wrap gap-4">
          <ProductFilter
            services={services}
            selectedServices={selectedServices}
            onFilterChange={setSelectedServices}
          />
          <div className="relative">
            <button
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors flex items-center gap-2"
            >
              {selectedTags.length > 0 ? `${selectedTags.length} Tags Selected` : 'All Tags'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
            {isTagDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      setIsTagDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedTags.length === 0
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    All Tags
                  </button>
                  {uniqueTags.map((tag) => (
                    <label
                      key={tag}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
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
                        className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-primary-600"
                      />
                      {tag}
                    </label>
                  ))}
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