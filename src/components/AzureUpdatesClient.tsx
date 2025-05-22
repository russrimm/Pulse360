'use client';

import { useState, useMemo, useEffect } from 'react';
import { AzureUpdate } from '@/lib/types';
import { AzureUpdatesContent } from './AzureUpdatesContent';
import { SearchBar } from './SearchBar';
import { ProductFilter } from './ProductFilter';
import { SeverityFilter } from './SeverityFilter';
import { MessageCard } from './MessageCard';

interface AzureUpdatesClientProps {
  initialUpdates: AzureUpdate[];
}

export function AzureUpdatesClient({ initialUpdates }: AzureUpdatesClientProps) {
  const [messages, setMessages] = useState<AzureUpdate[]>(initialUpdates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/azure-updates');
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleProductFilterChange = (products: string[]) => {
    setSelectedProducts(products);
  };

  const handleSeverityFilterChange = (severities: string[]) => {
    setSelectedSeverities(severities);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ProductFilter
          services={Array.from(new Set(messages.map(m => m.product)))}
          selectedServices={selectedProducts}
          onFilterChange={handleProductFilterChange}
        />
        <SeverityFilter
          severities={Array.from(new Set(messages.map(m => m.severity)))}
          selectedSeverities={selectedSeverities}
          onFilterChange={handleSeverityFilterChange}
        />
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="grid gap-4">
        {messages
          .filter(m => 
            (selectedProducts.length === 0 || selectedProducts.includes(m.product)) &&
            (selectedSeverities.length === 0 || selectedSeverities.includes(m.severity)) &&
            (searchQuery === '' || 
              m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map(message => (
            <MessageCard key={message.id} message={message} />
          ))}
      </div>
    </div>
  );
} 