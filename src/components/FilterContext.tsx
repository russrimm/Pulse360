'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { buildMessageFilterParams, parseMessageFilters } from '@/lib/messageFilterUrl';
import type { DateFilterType } from '@/lib/messageFilterUrl';

export type FilterType = null | 'product' | 'tags' | 'severity' | 'area' | 'date';

interface FilterContextValue {
  openFilter: FilterType;
  setOpenFilter: (filter: FilterType) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  selectedDateFilter: DateFilterType;
  setSelectedDateFilter: (filter: DateFilterType) => void;
  customDateRange: { from: string; to: string };
  setCustomDateRange: (range: { from: string; to: string }) => void;
  showMajorChangesOnly: boolean;
  setShowMajorChangesOnly: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFilters = useMemo(
    () => parseMessageFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const [openFilter, setOpenFilter] = useState<FilterType>(null);
  const [selectedTags, setSelectedTags] = useState(initialFilters.selectedTags);
  const [selectedServices, setSelectedServices] = useState(initialFilters.selectedServices);
  const [selectedDateFilter, setSelectedDateFilter] = useState(initialFilters.selectedDateFilter);
  const [customDateRange, setCustomDateRange] = useState(initialFilters.customDateRange);
  const [showMajorChangesOnly, setShowMajorChangesOnly] = useState(
    initialFilters.showMajorChangesOnly
  );
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);

  useEffect(() => {
    const nextParams = buildMessageFilterParams(new URLSearchParams(searchParams.toString()), {
      searchQuery,
      selectedTags,
      selectedServices,
      selectedDateFilter,
      customDateRange,
      showMajorChangesOnly,
    });
    const nextQuery = nextParams.toString();
    if (nextQuery === searchParams.toString()) return;

    window.history.replaceState(null, '', nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [
    customDateRange,
    pathname,
    searchParams,
    searchQuery,
    selectedDateFilter,
    selectedServices,
    selectedTags,
    showMajorChangesOnly,
  ]);

  return (
    <FilterContext.Provider
      value={{
        openFilter,
        setOpenFilter,
        selectedTags,
        setSelectedTags,
        selectedServices,
        setSelectedServices,
        selectedDateFilter,
        setSelectedDateFilter,
        customDateRange,
        setCustomDateRange,
        showMajorChangesOnly,
        setShowMajorChangesOnly,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within a FilterProvider');
  return ctx;
} 