import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/types';
import { useFilterContext } from './FilterContext';

interface TagsFilterProps {
  messages: Message[];
}

export function TagsFilter({ messages }: TagsFilterProps) {
  const { selectedTags, setSelectedTags } = useFilterContext();
  // Use local state for open/close
  const [isOpen, setIsOpen] = useState(false);
  const setOpen = setIsOpen;

  // Get unique tags from messages
  const uniqueTags = useMemo(() => {
    const allTags = messages.flatMap(message => message.tags);
    return Array.from(new Set(allTags)).sort();
  }, [messages]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const internalClick = useRef(false);

  // Click outside handler (same as ProductFilter)
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (internalClick.current) {
      internalClick.current = false;
      return;
    }
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, [setOpen]);

  // Remove useEffect for click outside

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      {/* Prevent event bubbling to avoid closing other filter dialogs */}
      <button
        onClick={() => setOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 h-8 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative w-full md:w-auto min-h-[32px]"
        aria-label="Filter tags"
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
        <span className="text-sm font-medium">Tags</span>
        {selectedTags.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
            {selectedTags.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Tags</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {uniqueTags.map((tag) => (
              <label
                key={tag}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags([...selectedTags, tag]);
                    } else {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  onClick={e => e.stopPropagation()}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{tag}</span>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setSelectedTags([]);
                setOpen(false);
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