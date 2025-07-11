'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FilterType = null | 'product' | 'tags' | 'severity' | 'area' | 'date';
export type DateFilterType = 'all' | 'last30' | 'last14' | 'last7' | 'custom';

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
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [openFilter, setOpenFilter] = useState<FilterType>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showMajorChangesOnly, setShowMajorChangesOnly] = useState(false);

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