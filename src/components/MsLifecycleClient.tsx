'use client';

import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { addMonths } from 'date-fns';
import { getLifecycleExpiryStatus, parseLifecycleDate } from '@/lib/lifecycle';

interface LifecycleRow {
  product: string;
  edition: string;
  release: string;
  category: string;
  supportPolicy: string;
  startDate: string | null;
  mainStreamEndDate: string | null;
  extendedEndDate: string | null;
  retirementDate: string | null;
  releaseStartDate: string | null;
  releaseEndDate: string | null;
  docsUrl: string;
  endOfSupportDate: string | null;
}

interface ApiResponse {
  rows: LifecycleRow[];
  sourceUrl: string;
  cachedAt: string;
  fromCache: boolean;
  error?: string;
  isStale?: boolean;
}

type SortField =
  | 'product'
  | 'startDate'
  | 'mainStreamEndDate'
  | 'extendedEndDate'
  | 'retirementDate'
  | 'releaseStartDate'
  | 'releaseEndDate'
  | 'endOfSupportDate';
type SortDir = 'asc' | 'desc';
type LifecycleView = 'microsoft' | 'azure';
type ExpirationWindow = 3 | 6 | 9 | 12;
type ColumnId =
  | 'product'
  | 'edition'
  | 'release'
  | 'category'
  | 'supportPolicy'
  | 'startDate'
  | 'mainStreamEndDate'
  | 'extendedEndDate'
  | 'retirementDate'
  | 'releaseStartDate'
  | 'releaseEndDate'
  | 'docsUrl'
  | 'endOfSupportDate';

interface ColumnOption {
  id: ColumnId;
  label: string;
}

interface LifecycleGridProps {
  title?: string;
  rows: LifecycleRow[];
  sourceUrl: string;
  sourceHref?: string;
  sourceLabel?: string;
  cachedAt: string;
  fromCache: boolean;
  searchPlaceholder: string;
  dropdownFilterField: 'product' | 'category';
  dropdownFilterLabel: string;
  columnOptions: ColumnOption[];
  showExpirationFilter?: boolean;
}

const LIFECYCLE_EXPORT_URL = 'https://learn.microsoft.com/en-us/lifecycle/products/export/';

const MICROSOFT_COLUMN_OPTIONS: ColumnOption[] = [
  { id: 'product', label: 'Product Listing Name' },
  { id: 'edition', label: 'Edition' },
  { id: 'release', label: 'Release' },
  { id: 'supportPolicy', label: 'Support Policy' },
  { id: 'startDate', label: 'Start Date' },
  { id: 'mainStreamEndDate', label: 'Mainstream End Date' },
  { id: 'extendedEndDate', label: 'Extended End Date' },
  { id: 'retirementDate', label: 'Retirement Date' },
  { id: 'releaseStartDate', label: 'Release Start Date' },
  { id: 'releaseEndDate', label: 'Release End Date' },
  { id: 'docsUrl', label: 'Docs' },
  { id: 'endOfSupportDate', label: 'End of Support' },
];

const AZURE_FEATURE_COLUMN_OPTIONS: ColumnOption[] = [
  { id: 'product', label: 'Product Listing Name' },
  { id: 'category', label: 'Azure Feature' },
  { id: 'releaseEndDate', label: 'Release End Date' },
  { id: 'docsUrl', label: 'DocsUrl' },
  { id: 'endOfSupportDate', label: 'End of Support' },
];

const EXPIRATION_WINDOW_OPTIONS: ExpirationWindow[] = [3, 6, 9, 12];
const EXPIRATION_DATE_FIELDS = ['mainStreamEndDate', 'extendedEndDate', 'retirementDate'] as const;
const INITIAL_VISIBLE_ROWS = 100;
const LOAD_MORE_ROWS = 100;

function escapeCsvValue(value: string | null): string {
  const text = value ?? '';
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function isExpiringWithin(row: LifecycleRow, months: ExpirationWindow, today: Date): boolean {
  const cutoff = addMonths(today, months);

  return EXPIRATION_DATE_FIELDS.some(field => {
    const value = row[field];
    if (!value) return false;

    const expirationDate = parseLifecycleDate(value);
    return expirationDate !== null && expirationDate >= today && expirationDate <= cutoff;
  });
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = parseLifecycleDate(value);
  if (!date) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getMonthsRemaining(value: string): string | null {
  const endDate = parseLifecycleDate(value);
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (endDate < today) return 'Out of Support';

  const monthsRemaining =
    (endDate.getFullYear() - today.getFullYear()) * 12 + endDate.getMonth() - today.getMonth();

  if (monthsRemaining === 0) return 'Less than 1 month';
  return `${monthsRemaining} month${monthsRemaining === 1 ? '' : 's'}`;
}

function formatEndOfSupport(row: LifecycleRow): string {
  const sourceStatus = formatDate(row.endOfSupportDate);
  if (!row.endOfSupportDate?.toLowerCase().includes('month') || !row.releaseEndDate)
    return sourceStatus;

  const remaining = getMonthsRemaining(row.releaseEndDate);
  if (!remaining) return sourceStatus;

  return `${remaining} · ${formatDate(row.releaseEndDate)}`;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (field !== sortField) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

function LifecycleGrid({
  title,
  rows,
  sourceUrl,
  sourceHref,
  sourceLabel,
  cachedAt,
  fromCache,
  searchPlaceholder,
  dropdownFilterField,
  dropdownFilterLabel,
  columnOptions,
  showExpirationFilter = false,
}: LifecycleGridProps) {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [dropdownFilter, setDropdownFilter] = useState('All');
  const [expirationWindow, setExpirationWindow] = useState<ExpirationWindow | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('product');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(
    columnOptions.map(column => column.id)
  );
  const [visibleRowCount, setVisibleRowCount] = useState(INITIAL_VISIBLE_ROWS);

  useEffect(() => {
    setVisibleColumns(columnOptions.map(column => column.id));
    setSortField('product');
    setSortDir('asc');
  }, [columnOptions]);

  const dropdownFilterOptions = useMemo(() => {
    const values = Array.from(
      new Set(rows.map(row => row[dropdownFilterField]).filter(Boolean))
    ).sort();
    return ['All', ...values];
  }, [rows, dropdownFilterField]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows
      .filter(row => {
        const release = row.release.toLowerCase();
        const category = row.category.toLowerCase();

        if (
          query &&
          !row.product.toLowerCase().includes(query) &&
          !release.includes(query) &&
          !category.includes(query)
        )
          return false;
        if (dropdownFilter !== 'All' && row[dropdownFilterField] !== dropdownFilter) return false;
        if (expirationWindow !== 'All' && !isExpiringWithin(row, expirationWindow, today))
          return false;

        return true;
      })
      .sort((a, b) => {
        let va: string;
        let vb: string;

        if (sortField === 'product') {
          va = a.product.toLowerCase();
          vb = b.product.toLowerCase();
        } else {
          va = a[sortField] ?? '9999-12-31';
          vb = b[sortField] ?? '9999-12-31';
        }

        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    rows,
    deferredSearch,
    dropdownFilter,
    dropdownFilterField,
    expirationWindow,
    sortField,
    sortDir,
  ]);
  const visibleRows = filtered.slice(0, visibleRowCount);

  const isVisible = (columnId: ColumnId) => visibleColumns.includes(columnId);

  function handleSort(field: SortField) {
    setVisibleRowCount(INITIAL_VISIBLE_ROWS);
    if (field === sortField) {
      setSortDir(current => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function toggleColumn(columnId: ColumnId) {
    setVisibleColumns(current => {
      if (current.includes(columnId)) {
        if (current.length === 1) return current;

        const next = current.filter(id => id !== columnId);
        if (columnId === sortField) {
          const fallbackSort = next.includes('product')
            ? 'product'
            : (next.find(
                id =>
                  id === 'startDate' ||
                  id === 'mainStreamEndDate' ||
                  id === 'extendedEndDate' ||
                  id === 'retirementDate' ||
                  id === 'releaseStartDate' ||
                  id === 'releaseEndDate' ||
                  id === 'endOfSupportDate'
              ) as SortField | undefined);

          if (fallbackSort) {
            setSortField(fallbackSort);
            setSortDir('asc');
          }
        }

        return next;
      }

      return [...current, columnId];
    });
  }

  function exportCsv() {
    const columns = columnOptions.filter(column => visibleColumns.includes(column.id));
    const csv = [
      columns.map(column => escapeCsvValue(column.label)).join(','),
      ...filtered.map(row => columns.map(column => escapeCsvValue(row[column.id])).join(',')),
    ].join('\r\n');
    const blobUrl = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `pulse360-lifecycle-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <section className="mb-10 flex min-h-0 flex-col md:mb-0 md:h-full">
      {title && (
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      )}

      <div className="mb-2 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setVisibleRowCount(INITIAL_VISIBLE_ROWS);
          }}
          placeholder={searchPlaceholder}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          aria-label={`Filter by ${dropdownFilterLabel}`}
          value={dropdownFilter}
          onChange={event => {
            setDropdownFilter(event.target.value);
            setVisibleRowCount(INITIAL_VISIBLE_ROWS);
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {dropdownFilterOptions.map(value => (
            <option key={value} value={value}>
              {value === 'All' ? `All ${dropdownFilterLabel}` : value}
            </option>
          ))}
        </select>
        {showExpirationFilter && (
          <select
            aria-label="Filter by expiration date"
            value={expirationWindow}
            onChange={event => {
              const value = event.target.value;
              setExpirationWindow(value === 'All' ? 'All' : (Number(value) as ExpirationWindow));
              setVisibleRowCount(INITIAL_VISIBLE_ROWS);
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All expiration dates</option>
            {EXPIRATION_WINDOW_OPTIONS.map(months => (
              <option key={months} value={months}>
                Expiring within {months} months
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Export CSV
        </button>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Choose columns"
              title="Choose columns"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="2.5" y="3" width="4" height="14" rx="1.2" />
                <rect x="8" y="3" width="4" height="14" rx="1.2" />
                <rect x="13.5" y="3" width="4" height="14" rx="1.2" />
              </svg>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={8}
              align="end"
              className="z-50 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-3"
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Select Columns
              </div>
              <div className="space-y-1 max-h-72 overflow-auto pr-1">
                {columnOptions.map(option => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible(option.id)}
                      onChange={() => toggleColumn(option.id)}
                      disabled={visibleColumns.length === 1 && isVisible(option.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className="mb-2 flex items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {filtered.length.toLocaleString()} item{filtered.length !== 1 ? 's' : ''} matching
          {rows.length !== filtered.length && <> (of {rows.length.toLocaleString()})</>} &bull;
          source:{' '}
          <a
            href={sourceHref ?? sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 underline hover:no-underline"
          >
            {sourceLabel ?? sourceUrl.split('/').pop()}
          </a>
        </span>
        <span>
          Cached {new Date(cachedAt).toLocaleString()}
          {fromCache ? ' (cached)' : ' (fresh)'}
        </span>
      </div>

      <div
        data-testid="lifecycle-table-scroll"
        className="overflow-x-scroll overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 md:min-h-0 md:flex-1"
      >
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              {isVisible('product') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('product')}
                >
                  {columnOptions.find(c => c.id === 'product')?.label ?? 'Product'}
                  <SortIcon field="product" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('edition') && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {columnOptions.find(c => c.id === 'edition')?.label}
                </th>
              )}
              {isVisible('release') && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {columnOptions.find(c => c.id === 'release')?.label}
                </th>
              )}
              {isVisible('category') && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {columnOptions.find(c => c.id === 'category')?.label}
                </th>
              )}
              {isVisible('supportPolicy') && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {columnOptions.find(c => c.id === 'supportPolicy')?.label}
                </th>
              )}
              {isVisible('startDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('startDate')}
                >
                  {columnOptions.find(c => c.id === 'startDate')?.label}
                  <SortIcon field="startDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('mainStreamEndDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('mainStreamEndDate')}
                >
                  {columnOptions.find(c => c.id === 'mainStreamEndDate')?.label}
                  <SortIcon field="mainStreamEndDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('extendedEndDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('extendedEndDate')}
                >
                  {columnOptions.find(c => c.id === 'extendedEndDate')?.label}
                  <SortIcon field="extendedEndDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('retirementDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('retirementDate')}
                >
                  {columnOptions.find(c => c.id === 'retirementDate')?.label}
                  <SortIcon field="retirementDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('releaseStartDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('releaseStartDate')}
                >
                  {columnOptions.find(c => c.id === 'releaseStartDate')?.label}
                  <SortIcon field="releaseStartDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('releaseEndDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('releaseEndDate')}
                >
                  {columnOptions.find(c => c.id === 'releaseEndDate')?.label}
                  <SortIcon field="releaseEndDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
              {isVisible('docsUrl') && (
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {columnOptions.find(c => c.id === 'docsUrl')?.label}
                </th>
              )}
              {isVisible('endOfSupportDate') && (
                <th
                  className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort('endOfSupportDate')}
                >
                  {columnOptions.find(c => c.id === 'endOfSupportDate')?.label}
                  <SortIcon field="endOfSupportDate" sortField={sortField} sortDir={sortDir} />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                >
                  No items match the current filters.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => {
                const status = getLifecycleExpiryStatus(row);
                return (
                  <tr
                    key={`${row.product}-${row.category}-${index}`}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      status === 'expired'
                        ? 'bg-red-50/40 dark:bg-red-950/20'
                        : status === 'expiring-soon'
                          ? 'bg-yellow-50/40 dark:bg-yellow-950/20'
                          : ''
                    }`}
                  >
                    {isVisible('product') && (
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {row.product}
                      </td>
                    )}
                    {isVisible('edition') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.edition || '—'}
                      </td>
                    )}
                    {isVisible('release') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.release || '—'}
                      </td>
                    )}
                    {isVisible('category') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.category || '—'}
                      </td>
                    )}
                    {isVisible('supportPolicy') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {row.supportPolicy || '—'}
                      </td>
                    )}
                    {isVisible('startDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.startDate)}
                      </td>
                    )}
                    {isVisible('mainStreamEndDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.mainStreamEndDate)}
                      </td>
                    )}
                    {isVisible('extendedEndDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.extendedEndDate)}
                      </td>
                    )}
                    {isVisible('retirementDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.retirementDate)}
                      </td>
                    )}
                    {isVisible('releaseStartDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.releaseStartDate)}
                      </td>
                    )}
                    {isVisible('releaseEndDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(row.releaseEndDate)}
                      </td>
                    )}
                    {isVisible('docsUrl') && (
                      <td className="px-4 py-3">
                        {row.docsUrl ? (
                          <a
                            href={row.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 underline hover:no-underline text-xs"
                          >
                            Docs
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    {isVisible('endOfSupportDate') && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatEndOfSupport(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {visibleRows.length < filtered.length ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleRowCount(count => count + LOAD_MORE_ROWS)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Load {Math.min(LOAD_MORE_ROWS, filtered.length - visibleRows.length)} more
          </button>
        </div>
      ) : null}
    </section>
  );
}

function isAzureFeatureRetirementRow(row: LifecycleRow): boolean {
  return Boolean(row.category?.trim());
}

export function MsLifecycleClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lifecycleView, setLifecycleView] = useState<LifecycleView>('microsoft');

  useEffect(() => {
    setLoading(true);
    fetch('/api/mslifecycle')
      .then(response => response.json())
      .then((json: ApiResponse) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(fetchError => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, []);

  const splitRows = useMemo(() => {
    if (!data) {
      return {
        microsoftProductRows: [] as LifecycleRow[],
        azureFeatureRows: [] as LifecycleRow[],
      };
    }

    const microsoftProductRows = data.rows.filter(row => !isAzureFeatureRetirementRow(row));
    const azureFeatureRows = data.rows.filter(isAzureFeatureRetirementRow);

    return { microsoftProductRows, azureFeatureRows };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 dark:text-gray-400">
        <svg className="animate-spin mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading lifecycle data… (this may take a moment on first load)
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-700 dark:text-red-300">
        <strong>Failed to load lifecycle data:</strong> {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-3 text-center text-sm text-gray-500 dark:text-gray-400">
        {lifecycleView === 'microsoft' ? (
          <>
            Microsoft product support and Azure feature retirement dates sourced from the{' '}
            <a
              href={LIFECYCLE_EXPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline hover:no-underline dark:text-primary-400"
            >
              Microsoft Lifecycle export
            </a>
            .
          </>
        ) : (
          <>
            Azure feature retirement dates sourced from the{' '}
            <a
              href={LIFECYCLE_EXPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline hover:no-underline dark:text-primary-400"
            >
              Microsoft Lifecycle export
            </a>
            .
          </>
        )}
      </p>
      {data.isStale ? (
        <p
          className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Lifecycle data was last refreshed {new Date(data.cachedAt).toLocaleString()} and may be
          out of date.
        </p>
      ) : null}

      <div
        role="tablist"
        aria-label="Lifecycle view"
        className="mb-3 grid w-full grid-cols-2 rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800 sm:mx-auto sm:max-w-lg"
      >
        <button
          type="button"
          role="tab"
          id="microsoft-lifecycle-tab"
          aria-controls="microsoft-lifecycle-panel"
          aria-selected={lifecycleView === 'microsoft'}
          onClick={() => setLifecycleView('microsoft')}
          className={`min-h-10 rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            lifecycleView === 'microsoft'
              ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          Microsoft Product Lifecycle
        </button>
        <button
          type="button"
          role="tab"
          id="azure-lifecycle-tab"
          aria-controls="azure-lifecycle-panel"
          aria-selected={lifecycleView === 'azure'}
          onClick={() => setLifecycleView('azure')}
          className={`min-h-10 rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            lifecycleView === 'azure'
              ? 'bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          Azure Lifecycle
        </button>
      </div>

      {lifecycleView === 'microsoft' ? (
        <div
          className="min-h-0 flex-1"
          role="tabpanel"
          id="microsoft-lifecycle-panel"
          aria-labelledby="microsoft-lifecycle-tab"
        >
          <LifecycleGrid
            rows={splitRows.microsoftProductRows}
            sourceUrl={data.sourceUrl}
            cachedAt={data.cachedAt}
            fromCache={data.fromCache}
            searchPlaceholder="Search Microsoft product or release…"
            dropdownFilterField="product"
            dropdownFilterLabel="products"
            columnOptions={MICROSOFT_COLUMN_OPTIONS}
            showExpirationFilter
          />
        </div>
      ) : (
        <div
          className="min-h-0 flex-1"
          role="tabpanel"
          id="azure-lifecycle-panel"
          aria-labelledby="azure-lifecycle-tab"
        >
          <LifecycleGrid
            rows={splitRows.azureFeatureRows}
            sourceUrl={data.sourceUrl}
            sourceHref={LIFECYCLE_EXPORT_URL}
            sourceLabel="Microsoft Lifecycle export"
            cachedAt={data.cachedAt}
            fromCache={data.fromCache}
            searchPlaceholder="Search Azure feature or release…"
            dropdownFilterField="category"
            dropdownFilterLabel="Azure features"
            columnOptions={AZURE_FEATURE_COLUMN_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}
