'use client';

import { useState, useEffect } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';

interface MessageListProps {
  initialMessages: Message[];
}

export function MessageList({ initialMessages }: MessageListProps) {
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(initialMessages);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    // Extract unique services
    const uniqueServices = Array.from(new Set(initialMessages.flatMap(m => m.service))).sort();
    setServices(uniqueServices);
  }, [initialMessages]);

  const handleFilterChange = (selectedService: string | null) => {
    if (!selectedService) {
      setFilteredMessages(initialMessages);
    } else {
      setFilteredMessages(initialMessages.filter(m => m.service.includes(selectedService)));
    }
  };

  return (
    <>
      <ProductFilter services={services} onFilterChange={handleFilterChange} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMessages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
    </>
  );
} 