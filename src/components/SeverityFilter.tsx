import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface SeverityFilterProps {
  severities: string[];
  selectedSeverities: string[];
  onFilterChange: (severities: string[]) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'message-center-severity-filters';

export function SeverityFilter({ severities, selectedSeverities, onFilterChange, isOpen, setOpen }: SeverityFilterProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const isSeveritySelected = useCallback((severity: string): boolean => {
    return selectedSeverities.includes(severity);
  }, [selectedSeverities]);

  const toggleSeverity = useCallback((severity: string) => {
    if (isSeveritySelected(severity)) {
      onFilterChange(selectedSeverities.filter(s => s !== severity));
    } else {
      onFilterChange([...selectedSeverities, severity]);
    }
  }, [selectedSeverities, onFilterChange, isSeveritySelected]);

  const handleClearAll = useCallback(() => {
    onFilterChange([]);
    setOpen(false);
  }, [onFilterChange, setOpen]);

  const sortedSeverities = useMemo(() => [...severities].sort(), [severities]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, [setOpen]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        const validFilters = parsedFilters.filter((filter: string) => severities.includes(filter));
        if (validFilters.length > 0) {
          onFilterChange(validFilters);
        }
      }
    } catch (error) {
      console.error('Error loading saved severity filters:', error);
    }
  }, [severities, onFilterChange]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        if (selectedSeverities.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSeverities));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving severity filters:', error);
      }
    }, 300);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedSeverities]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 relative"
        aria-label="Filter severity"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-sm font-medium">Severity</span>
        {selectedSeverities.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
            {selectedSeverities.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-64 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Severity</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedSeverities.length} selected
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {sortedSeverities.map((severity) => (
              <label
                key={severity}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSeveritySelected(severity)}
                  onChange={() => toggleSeverity(severity)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-200 capitalize">{severity}</span>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClearAll}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 