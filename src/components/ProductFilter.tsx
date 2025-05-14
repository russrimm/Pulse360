'use client';

import { useState, useRef, useEffect } from 'react';

interface ProductFilterProps {
  services: string[];
  selectedServices: string[];
  onFilterChange: (services: string[]) => void;
}

// Map of service names to their normalized versions
const serviceNameMap: Record<string, string> = {
  'Microsoft Power Automate in Microsoft 365': 'Power Automate'
};

// Storage key for persisting filter settings
const STORAGE_KEY = 'message-center-filters';

// Function to normalize service names
const normalizeServiceName = (service: string): string => {
  // First check if there's a specific mapping
  if (serviceNameMap[service]) {
    return serviceNameMap[service];
  }
  
  // If the service contains "365", keep the full name
  if (service.includes('365')) {
    return service;
  }
  
  // Otherwise remove "Microsoft" prefix if it exists
  return service.replace(/^Microsoft\s+/, '');
};

export function ProductFilter({ services, selectedServices, onFilterChange }: ProductFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved filters on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        // Only apply saved filters if they exist in current services
        const validFilters = parsedFilters.filter((filter: string) => 
          services.some(s => normalizeServiceName(s) === filter)
        );
        if (validFilters.length > 0) {
          onFilterChange(validFilters);
        }
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, [services, onFilterChange]);

  // Save filters whenever they change
  useEffect(() => {
    try {
      if (selectedServices.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedServices));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, [selectedServices]);

  // Normalize services and remove duplicates
  const normalizedServices = Array.from(new Set(services.map(normalizeServiceName))).sort();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleService = (service: string) => {
    // Get all original services that map to this normalized service
    const originalServices = services.filter(s => normalizeServiceName(s) === service);
    
    const newSelection = selectedServices.includes(service)
      ? selectedServices.filter(s => !originalServices.includes(s))
      : [...selectedServices, ...originalServices];
    
    onFilterChange(newSelection);
  };

  // Check if any of the original services for a normalized service are selected
  const isServiceSelected = (normalizedService: string): boolean => {
    return services
      .filter(s => normalizeServiceName(s) === normalizedService)
      .some(s => selectedServices.includes(s));
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 relative"
        aria-label="Filter products"
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
        {selectedServices.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
            {selectedServices.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Products</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedServices.length} product{selectedServices.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {normalizedServices.map((service) => (
              <label
                key={service}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isServiceSelected(service)}
                  onChange={() => toggleService(service)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{service}</span>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onFilterChange([])}
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