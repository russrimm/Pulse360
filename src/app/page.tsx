'use client';

import { useState, useEffect } from 'react';
import { MessageList } from '@/components/MessageList';
import { Message } from '@/lib/types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchMessages();
  }, []);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="text-red-500">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-6 lg:p-8">
      <MessageList messages={messages} />
    </main>
  );
} 