'use client';
import { useEffect, useState } from 'react';
import { FilterProvider } from './FilterContext';
import { HomeContent } from './HomeContent';
import { getMessages } from '@/lib/api';
import type { Message } from '@/lib/types';

export default function MessageCenterClient() {
  console.log('MessageCenterClient mounted');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/messages')
      .then(res => res.json())
      .then((msgs) => {
        setMessages(Array.isArray(msgs) ? msgs : []);
        setLoading(false);
      })
      .catch(() => {
        setMessages([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Microsoft 365 Message Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Stay informed about Microsoft 365 service updates and changes
          </p>
        </div>
        <HomeContent messages={messages} />
      </div>
    </div>
  );
} 