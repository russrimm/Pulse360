'use client';
import { useEffect, useState } from 'react';
import { HomeContent } from './HomeContent';
import type { Message } from '@/lib/types';

export default function MessageCenterClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetch('/api/messages')
      .then(res => {
        if (!res.ok) {
          return res.json().then(body => {
            throw new Error(body.detail || body.error || `HTTP ${res.status}`);
          });
        }
        return res.json();
      })
      .then((msgs) => {
        if (Array.isArray(msgs)) {
          setMessages(msgs);
        } else {
          setMessages([]);
          setHasError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setMessages([]);
        setHasError(true);
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
        {hasError && (
          <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">
            Messages are temporarily unavailable. Please try again shortly.
          </div>
        )}
        <HomeContent messages={messages} />
      </div>
    </div>
  );
}