'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from './LoadingSpinner';

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

  // Initialize filtered messages and services
  useEffect(() => {
    if (!messages) return;
    
    setFilteredMessages(messages);
    const uniqueServices = Array.from(new Set(messages.flatMap(m => m.service))).sort((a, b) => a.localeCompare(b));
    setServices(uniqueServices);
  }, [messages]);

  // Update filtered messages when selection changes
  useEffect(() => {
    if (!messages) return;
    
    if (selectedServices.length === 0) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message =>
        message.service.some(service => selectedServices.includes(service))
      );
      setFilteredMessages(filtered);
    }
    setPage(1);
  }, [messages, selectedServices]);

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

  const handleMessageClick = (messageId: string) => {
    router.push(`/message/${messageId}`);
  };

  const handleSearch = (filtered: Message[]) => {
    setFilteredMessages(filtered);
    setPage(1);
  };

  if (!messages) return null;

  return (
    <div className="relative">
      {isLoading && <LoadingSpinner />}
      <div className="mb-6">
        <ProductFilter
          services={services}
          selectedServices={selectedServices}
          onFilterChange={setSelectedServices}
        />
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