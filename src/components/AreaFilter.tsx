'use client';

import { useState, useRef, useEffect } from 'react';

interface AreaFilterProps {
  areas: string[];
  selectedAreas: string[];
  onFilterChange: (areas: string[]) => void;
}

export function AreaFilter({ areas, selectedAreas, onFilterChange }: AreaFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAreaToggle = (area: string) => {
    if (selectedAreas.includes(area)) {
      onFilterChange(selectedAreas.filter(a => a !== area));
    } else {
      onFilterChange([...selectedAreas, area]);
    }
  };

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 h-8 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative w-full md:w-auto min-h-[32px]"
        aria-label="Filter by area"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium">Area</span>
        {selectedAreas.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
            {selectedAreas.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter by Area</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {areas.map((area) => (
              <label
                key={area}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(area)}
                  onChange={() => handleAreaToggle(area)}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">{area}</span>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onFilterChange([]);
                setIsOpen(false);
              }}
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