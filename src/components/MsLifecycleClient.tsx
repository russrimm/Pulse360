'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface LifecycleRow {
  product: string;
  version: string;
  category: string;
  startDate: string | null;
  endOfSupportDate: string | null;
  extendedEndDate: string | null;
  retirementDate: string | null;
}

interface ApiResponse {
  rows: LifecycleRow[];
  sourceUrl: string;
  cachedAt: string;
  fromCache: boolean;
  error?: string;
}

type SortField = 'product' | 'endOfSupportDate' | 'retirementDate' | 'extendedEndDate';
type SortDir = 'asc' | 'desc';

const STATUS_FILTERS = ['All', 'Expiring Soon', 'Expired', 'Active'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function getExpiryStatus(row: LifecycleRow): 'expired' | 'expiring-soon' | 'active' | 'unknown' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soonMs = 180 * 24 * 60 * 60 * 1000; // 180 days

  const eos = row.endOfSupportDate ? new Date(row.endOfSupportDate) : null;
  const ext = row.extendedEndDate ? new Date(row.extendedEndDate) : null;
  const ret = row.retirementDate ? new Date(row.retirementDate) : null;

  // Use the latest known date as the "support end"
  const dates = [eos, ext, ret].filter(Boolean) as Date[];
  if (dates.length === 0) return 'unknown';

  const latest = new Date(Math.max(...dates.map(d => d.getTime())));

  if (latest < today) return 'expired';
  if (latest.getTime() - today.getTime() <= soonMs) return 'expiring-soon';
  return 'active';
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }: { status: ReturnType<typeof getExpiryStatus> }) {
  const map = {
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    'expiring-soon': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    unknown: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  const label = {
    expired: 'Expired',
    'expiring-soon': 'Expiring Soon',
    active: 'Active',
    unknown: 'Unknown',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

const PAGE_SIZE = 50;

export function MsLifecycleClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortField, setSortField] = useState<SortField>('endOfSupportDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch('/api/mslifecycle')
      .then(r => r.json())
      .then((json: ApiResponse) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    const cats = Array.from(new Set(data.rows.map(r => r.category).filter(Boolean))).sort();
    return ['All', ...cats];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.rows
      .filter(r => {
        if (q && !r.product.toLowerCase().includes(q) && !r.version.toLowerCase().includes(q)) return false;
        if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
        if (statusFilter !== 'All') {
          const s = getExpiryStatus(r);
          if (statusFilter === 'Expired' && s !== 'expired') return false;
          if (statusFilter === 'Expiring Soon' && s !== 'expiring-soon') return false;
          if (statusFilter === 'Active' && s !== 'active') return false;
        }
        return true;
      })
      .sort((a, b) => {
        let va: string, vb: string;
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
  }, [data, search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleCategory(v: string) {
    setCategoryFilter(v);
    setPage(1);
  }

  function handleStatus(v: StatusFilter) {
    setStatusFilter(v);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 dark:text-gray-400">
        <svg className="animate-spin mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search product or version…"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={categoryFilter}
          onChange={e => handleCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => handleStatus(e.target.value as StatusFilter)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {filtered.length.toLocaleString()} product{filtered.length !== 1 ? 's' : ''} matching
          {data && (
            <> &bull; source: <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 underline hover:no-underline">{data.sourceUrl.split('/').pop()}</a></>
          )}
        </span>
        <span>
          Cached {new Date(data.cachedAt).toLocaleString()}
          {data.fromCache ? ' (cached)' : ' (fresh)'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('product')}
              >
                Product <SortIcon field="product" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Version</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Category</th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('endOfSupportDate')}
              >
                End of Support <SortIcon field="endOfSupportDate" sortField={sortField} sortDir={sortDir} />
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('extendedEndDate')}
              >
                Extended End <SortIcon field="extendedEndDate" sortField={sortField} sortDir={sortDir} />
              </th>
              <th
                className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 cursor-pointer whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('retirementDate')}
              >
                Retirement <SortIcon field="retirementDate" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                  No products match the current filters.
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => {
                const status = getExpiryStatus(row);
                return (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      status === 'expired' ? 'bg-red-50/40 dark:bg-red-950/20' :
                      status === 'expiring-soon' ? 'bg-yellow-50/40 dark:bg-yellow-950/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.product}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.version || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(row.endOfSupportDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(row.extendedEndDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(row.retirementDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
