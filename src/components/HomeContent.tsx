'use client';

import { useState } from 'react';
import { MessageList } from '@/components/MessageList';
import { SearchBar } from '@/components/SearchBar';
import { Message } from '@/lib/types';

interface HomeContentProps {
  messages: Message[];
}

export function HomeContent({ messages }: HomeContentProps) {
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(messages);
  return (
    <>
      <SearchBar messages={messages} onSearch={setFilteredMessages} placeholder="Search by Title, Product, or Message ID..." />
      <MessageList messages={filteredMessages} />
    </>
  );
} 