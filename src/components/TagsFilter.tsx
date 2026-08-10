import { useMemo, useRef } from 'react';
import type { Message } from '@/lib/types';
import { useFilterContext } from './FilterContext';

interface TagsFilterProps {
  messages: Message[];
}

export function TagsFilter({ messages }: TagsFilterProps) {
  const {
    openFilter,
    setOpenFilter,
    selectedTags,
    setSelectedTags,
  } = useFilterContext();
  const isOpen = openFilter === 'tags';

  // Get unique tags from messages
  const uniqueTags = useMemo(() => {
    const allTags = messages.flatMap(message => message.tags);
    return Array.from(new Set(allTags)).sort();
  }, [messages]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpenFilter(isOpen ? null : 'tags')}
        aria-expanded={isOpen}
        className="relative flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm transition-colors hover:border-line-strong hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-auto"
        aria-label="Filter tags"
      >
        <svg
          className="h-4 w-4 text-ink-subtle"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 10V5a2 2 0 012-2z"
          />
        </svg>
        <span>Tags</span>
        {selectedTags.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
            {selectedTags.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="animate-fadein absolute z-10 mt-2 w-72 rounded-xl border border-line bg-surface-raised shadow-xl"
        >
          <div className="border-b border-line p-4">
            <h3 className="type-body-sm font-semibold text-ink">Filter tags</h3>
            <p className="type-meta mt-1 text-ink-subtle">
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {uniqueTags.map((tag) => (
              <label
                key={tag}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 hover:bg-surface-sunken"
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
                  className="h-4 w-4 rounded border-line accent-[var(--c-accent)]"
                  onClick={e => e.stopPropagation()}
                />
                <span className="ml-2 text-sm text-ink">{tag}</span>
              </label>
            ))}
          </div>
          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={() => {
                setSelectedTags([]);
                setOpenFilter(null);
              }}
              className="type-body-sm w-full rounded-md px-3 py-2 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 