'use client';
import { useEffect, useState } from 'react';
import { HomeContent } from './HomeContent';
import type { Message } from '@/lib/types';

export default function MessageCenterClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setMessages(Array.isArray(msgs) ? msgs : []);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
        setMessages([]);
        setError(err instanceof Error ? err.message : 'Failed to load messages');
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
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
              Unable to load messages
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all mb-3">
              {error}
            </p>
            {error.toLowerCase().includes('not configured') && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                Set <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">AZURE_API_URL</code> (APIM) or{' '}
                <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">AZURE_CLIENT_ID</code>{' '}+{' '}
                <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">AZURE_TENANT_ID</code>{' '}+{' '}
                <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">AZURE_CLIENT_SECRET</code>{' '}
                in your Azure Static Web App application settings.
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
        <HomeContent messages={messages} />
      </div>
    </div>
  );
}