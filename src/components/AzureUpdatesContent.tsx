'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { AzureUpdate } from '@/lib/types';
import { AzureUpdateCard } from './AzureUpdateCard';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from './LoadingSpinner';
import { useRouter } from 'next/navigation';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { getProductIcon } from './AzureUpdateCard';
import Image from 'next/image';

interface AzureUpdatesContentProps {
  updates: AzureUpdate[];
  searchQuery?: string;
}

const ITEMS_PER_PAGE = 12;

export function AzureUpdatesContent({ updates, searchQuery = '' }: AzureUpdatesContentProps) {
  const router = useRouter();
  const [filteredUpdates, setFilteredUpdates] = useState<AzureUpdate[]>(updates);
  const [visibleUpdates, setVisibleUpdates] = useState<AzureUpdate[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Sort updates by last modified date
  const sortedUpdates = useMemo(() => {
    return [...updates].sort((a, b) => {
      const dateA = new Date(a.modified).getTime();
      const dateB = new Date(b.modified).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [updates]);

  // Filter updates based on search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = sortedUpdates.filter(update => 
        update.title.toLowerCase().includes(query) ||
        update.description.toLowerCase().includes(query) ||
        update.products.some(product => product.toLowerCase().includes(query)) ||
        update.productCategories.some(category => category.toLowerCase().includes(query)) ||
        update.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredUpdates(filtered);
    } else {
      setFilteredUpdates(sortedUpdates);
    }
  }, [searchQuery, sortedUpdates]);

  // Get unique categories and tags
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    sortedUpdates.forEach(update => {
      update.productCategories.forEach(category => {
        categories.add(category);
      });
    });
    return Array.from(categories).sort();
  }, [sortedUpdates]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    sortedUpdates.forEach(update => {
      update.tags.forEach(tag => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [sortedUpdates]);

  // Get unique statuses
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    sortedUpdates.forEach(update => {
      if (update.status) {
        statuses.add(update.status);
      }
    });
    return Array.from(statuses).sort();
  }, [sortedUpdates]);

  // Get available categories based on selected products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    sortedUpdates.forEach(update => {
      if (selectedProducts.length === 0 || 
          update.products.some(product => selectedProducts.includes(product))) {
        update.productCategories.forEach(category => {
          categories.add(category);
        });
      }
    });
    return Array.from(categories).sort();
  }, [sortedUpdates, selectedProducts]);

  // Get available products based on selected categories
  const availableProducts = useMemo(() => {
    const products = new Set<string>();
    sortedUpdates.forEach(update => {
      if (selectedCategories.length === 0 || 
          update.productCategories.some(category => selectedCategories.includes(category))) {
        update.products.forEach(product => {
          products.add(product);
        });
      }
    });
    return Array.from(products).sort();
  }, [sortedUpdates, selectedCategories]);

  // Filter updates
  const filteredUpdatesList = useMemo(() => {
    return sortedUpdates.filter(update => {
      const matchesCategories = selectedCategories.length === 0 || 
        update.productCategories.some(category => selectedCategories.includes(category));
      const matchesProducts = selectedProducts.length === 0 || 
        update.products.some(product => selectedProducts.includes(product));
      const matchesTags = selectedTags.length === 0 || 
        update.tags.some(tag => selectedTags.includes(tag));
      const matchesStatus = selectedStatuses.length === 0 || 
        (update.status && selectedStatuses.includes(update.status));
      
      // Date range filtering
      let matchesDateRange = true;
      if (dateRange.start || dateRange.end) {
        const updateDate = parseISO(update.modified);
        
        if (dateRange.start && dateRange.end) {
          // Both start and end dates are selected
          const startDate = startOfDay(parseISO(dateRange.start));
          const endDate = endOfDay(parseISO(dateRange.end));
          matchesDateRange = isWithinInterval(updateDate, { start: startDate, end: endDate });
        } else if (dateRange.start) {
          // Only start date is selected
          const startDate = startOfDay(parseISO(dateRange.start));
          matchesDateRange = updateDate >= startDate;
        } else if (dateRange.end) {
          // Only end date is selected
          const endDate = endOfDay(parseISO(dateRange.end));
          matchesDateRange = updateDate <= endDate;
        }
      }

      return matchesCategories && matchesProducts && matchesTags && matchesStatus && matchesDateRange;
    });
  }, [sortedUpdates, selectedCategories, selectedProducts, selectedTags, selectedStatuses, dateRange]);

  // Update selected categories when products change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const newCategories = new Set<string>();
      sortedUpdates.forEach(update => {
        if (update.products.some(product => selectedProducts.includes(product))) {
          update.productCategories.forEach(category => {
            newCategories.add(category);
          });
        }
      });
      setSelectedCategories(prev => 
        prev.filter(category => newCategories.has(category))
      );
    }
  }, [selectedProducts, sortedUpdates]);

  // Update selected products when categories change
  useEffect(() => {
    if (selectedCategories.length > 0) {
      const newProducts = new Set<string>();
      sortedUpdates.forEach(update => {
        if (update.productCategories.some(category => selectedCategories.includes(category))) {
          update.products.forEach(product => {
            newProducts.add(product);
          });
        }
      });
      setSelectedProducts(prev => 
        prev.filter(product => newProducts.has(product))
      );
    }
  }, [selectedCategories, sortedUpdates]);

  // Update visible updates when page changes
  useEffect(() => {
    const start = 0;
    const end = page * ITEMS_PER_PAGE;
    setVisibleUpdates(filteredUpdatesList.slice(start, end));
  }, [filteredUpdatesList, page]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleUpdates.length < filteredUpdatesList.length) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleUpdates.length, filteredUpdatesList.length]);

  const handleUpdateClick = (updateId: string) => {
    router.push(`/azure-update/${updateId}`);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="md:sticky md:top-28 z-40 backdrop-blur-md pt-0 pb-2 border-b border-gray-200/50 dark:border-gray-700/50 -mt-4">
        <div className="mb-2">
          <div className="flex flex-wrap items-center mb-2 justify-between">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 ml-0 md:ml-8 text-right w-full md:w-auto md:flex-shrink-0 md:justify-end">
              Showing {filteredUpdatesList.length} update{filteredUpdatesList.length !== 1 ? 's' : ''}
              {filteredUpdatesList.length !== sortedUpdates.length && (
                <span className="ml-1">
                  (filtered from {sortedUpdates.length} total)
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Products Filter */}
            <div className="relative">
              <button
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative"
                aria-label="Filter products"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium">Products</span>
                {selectedProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                    {selectedProducts.length}
                  </span>
                )}
              </button>
              {isProductDropdownOpen && (
                <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Products</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    {availableProducts.map((product) => (
                      <label
                        key={product}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(p => p !== product));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          {(() => {
                            const iconPath = getProductIcon(product);
                            return iconPath && (
                              <Image
                                src={iconPath}
                                alt=""
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                            );
                          })()}
                          {product}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedProducts([]);
                        setIsProductDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Categories Filter */}
            <div className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative"
                aria-label="Filter categories"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium">Categories</span>
                {selectedCategories.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Categories</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedCategories.length} category{selectedCategories.length !== 1 ? 'ies' : ''} selected
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    {availableCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== category));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{category}</span>
                      </label>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tags Filter */}
            <div className="relative">
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative"
                aria-label="Filter tags"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm font-medium">Tags</span>
                {selectedTags.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                    {selectedTags.length}
                  </span>
                )}
              </button>
              {isTagDropdownOpen && (
                <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
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
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{tag}</span>
                      </label>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedTags([]);
                        setIsTagDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative"
                aria-label="Filter status"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Status</span>
                {selectedStatuses.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                    {selectedStatuses.length}
                  </span>
                )}
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter Status</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedStatuses.length} status{selectedStatuses.length !== 1 ? 'es' : ''} selected
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    {uniqueStatuses.map((status) => (
                      <label
                        key={status}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStatuses([...selectedStatuses, status]);
                            } else {
                              setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">{status}</span>
                      </label>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setSelectedStatuses([]);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="flex items-center justify-center gap-2 px-4 h-10 text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] dark:hover:shadow-[0_0_0_1px_rgba(59,130,246,0.5)] transition-all duration-300 relative"
                aria-label="Filter by date range"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Date Range</span>
                {(dateRange.start || dateRange.end) && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary-600 rounded-full">
                    1
                  </span>
                )}
              </button>
              {isDateDropdownOpen && (
                <div className="absolute z-10 w-72 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filter by Date Range</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Select a date range to filter updates
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="start-date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="end-date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setIsDateDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      Clear dates
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleUpdates.map((update) => (
            <AzureUpdateCard
              key={update.id}
              update={update}
              onClick={handleUpdateClick}
            />
          ))}
        </div>
        <div ref={loadMoreRef} className="h-10" />
      </div>
    </div>
  );
} 