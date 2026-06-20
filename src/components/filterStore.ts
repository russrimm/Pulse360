import { create, StateCreator } from 'zustand';

export type FilterType = null | 'product' | 'tags' | 'severity' | 'area' | 'date';
export type DateFilterType = 'all' | 'last30' | 'last14' | 'last7' | 'custom';

interface FilterState {
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

export const useFilterStore = create<FilterState>(((set => {
  const typedSet = set as Parameters<StateCreator<FilterState>>[0];
  return {
    openFilter: null,
    setOpenFilter: (filter: FilterType) => typedSet({ openFilter: filter }),
    selectedTags: [],
    setSelectedTags: (tags: string[]) => typedSet({ selectedTags: tags }),
    selectedServices: [],
    setSelectedServices: (services: string[]) => typedSet({ selectedServices: services }),
    selectedDateFilter: 'all',
    setSelectedDateFilter: (filter: DateFilterType) => typedSet({ selectedDateFilter: filter }),
    customDateRange: { from: '', to: '' },
    setCustomDateRange: (range: { from: string; to: string }) => typedSet({ customDateRange: range }),
    showMajorChangesOnly: false,
    setShowMajorChangesOnly: (show: boolean) => typedSet({ showMajorChangesOnly: show }),
  };
}))); 