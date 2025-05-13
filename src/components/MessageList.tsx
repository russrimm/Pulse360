'use client';

import { useState, useEffect } from 'react';
import { MessageCard } from '@/components/MessageCard';
import { ProductFilter } from '@/components/ProductFilter';
import { Message } from '@/lib/types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

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
  }, [messages, selectedServices]);

  if (!messages) return null;

  return (
    <div>
      <div className="mb-6">
        <ProductFilter
          services={services}
          selectedServices={selectedServices}
          onFilterChange={setSelectedServices}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMessages?.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
} 