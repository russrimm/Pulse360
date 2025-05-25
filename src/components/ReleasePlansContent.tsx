'use client';

import { useState, useMemo, useCallback } from 'react';
import { ReleasePlansList } from '@/components/ReleasePlansList';
import { SearchBar } from '@/components/SearchBar';
import * as Accordion from '@radix-ui/react-accordion';
import { ProductFilter } from '@/components/ProductFilter';
import { AreaFilter } from '@/components/AreaFilter';
import { addDays, isAfter, isBefore, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';

interface ReleasePlan {
  id: string;
  title: string;
  content: string;
  product: string;
  investmentArea: string;
  businessValue: string;
  enabledFor: string;
  publicPreviewDate: string;
  gaDate: string;
  publicPreviewWave: string;
  gaWave: string;
  published: string;
  lastUpdated: string;
  tags: string[];
  service: string[];
}

interface ReleasePlansContentProps {
  releasePlans: ReleasePlan[];
}

export function ReleasePlansContent({ releasePlans }: ReleasePlansContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'last30' | 'last7' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const handleProductFilterChange = useCallback((services: string[]) => {
    setSelectedServices(services)
  }, [])

  // All unique product names for the filter
  const allServices = Array.from(new Set(releasePlans.map(p => p.product))).sort();
  // All unique areas for the filter
  const allAreas = Array.from(new Set(releasePlans.map(p => p.investmentArea).filter(Boolean))).sort();

  // Filter plans by search, selected services, areas, and date
  const plansFiltered = useMemo(() => {
    return releasePlans.filter(plan => {
      const matchesSearch =
        !searchTerm ||
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService =
        selectedServices.length === 0 ||
        selectedServices.some(sel => plan.product?.trim().toLowerCase() === sel.trim().toLowerCase());
      const matchesArea = selectedAreas.length === 0 || selectedAreas.includes(plan.investmentArea);
      let matchesDate = true;
      if (selectedDateFilter === 'last30') {
        matchesDate = isAfter(parseISO(plan.published), subDays(new Date(), 30));
      } else if (selectedDateFilter === 'last7') {
        matchesDate = isAfter(parseISO(plan.published), subDays(new Date(), 7));
      } else if (selectedDateFilter === 'custom' && customDateRange.from && customDateRange.to) {
        const published = parseISO(plan.published);
        matchesDate =
          isAfter(published, startOfDay(parseISO(customDateRange.from))) &&
          isBefore(published, endOfDay(parseISO(customDateRange.to)));
      }
      return matchesSearch && matchesService && matchesArea && matchesDate;
    });
  }, [releasePlans, searchTerm, selectedServices, selectedAreas, selectedDateFilter, customDateRange]);

  // Group plans by product
  const plansByProduct = useMemo(() => {
    return plansFiltered.reduce((acc, plan) => {
      if (!plan.product) return acc;
      if (!acc[plan.product]) acc[plan.product] = [];
      acc[plan.product].push(plan);
      return acc;
    }, {} as Record<string, ReleasePlan[]>);
  }, [plansFiltered]);
  let productNames = Object.keys(plansByProduct);
  if (selectedServices.length > 0) productNames = productNames.filter(p => selectedServices.includes(p));

  return (
    <>
      <SearchBar
        messages={releasePlans}
        searchQuery={searchTerm}
        onSearchQueryChange={setSearchTerm}
      />
      <div className="flex flex-wrap gap-4 mt-4 mb-4 items-center">
        <ProductFilter
          services={allServices}
          selectedServices={selectedServices}
          onFilterChange={handleProductFilterChange}
        />
        <AreaFilter
          areas={allAreas}
          selectedAreas={selectedAreas}
          onFilterChange={setSelectedAreas}
        />
        <div className="relative">
          <button
            onClick={() => setSelectedDateFilter(selectedDateFilter === 'all' ? 'last30' : selectedDateFilter === 'last30' ? 'last7' : 'all')}
            className="flex items-center justify-center gap-2 px-4 h-8 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">{selectedDateFilter === 'all' ? 'All Dates' : selectedDateFilter === 'last30' ? 'Last 30 Days' : selectedDateFilter === 'last7' ? 'Last 7 Days' : 'Custom'}</span>
          </button>
        </div>
      </div>
      <Accordion.Root type="multiple" defaultValue={productNames} className="space-y-4 mt-8">
        {productNames.map(product => (
          <Accordion.Item value={product} key={product} className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/60">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex justify-between items-center px-6 py-4 text-2xl font-bold text-gray-900 dark:text-white mb-0 focus:outline-none">
                {product}
                <span className="ml-2 transition-transform group-data-[state=open]:rotate-180">
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-2 pb-4">
              <ReleasePlansList releasePlans={plansByProduct[product]} hideFilters={true} />
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </>
  );
} 