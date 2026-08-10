'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CVECard from '../../components/CVECard';

interface UpdateMonth {
  ID: string;
  DocumentTitle: string;
  InitialReleaseDate: string;
}

interface Vulnerability {
  ID: string;
  Title?: unknown;
  CVE?: string | string[];
  ProductStatuses?: unknown[];
  Threats?: unknown[];
  Remediations?: unknown[];
  [key: string]: unknown;
}

interface ProductTree {
  FullProductName?: { ProductID: string; Value: string }[];
}

interface CvrfResponse {
  Vulnerability?: Vulnerability[];
  ReleaseDate?: string;
  ProductTree?: ProductTree;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalVulnerabilities?: number;
}

function isUpdateMonth(value: unknown): value is UpdateMonth {
  if (!value || typeof value !== 'object') return false;
  const month = value as Record<string, unknown>;
  return (
    typeof month.ID === 'string' &&
    typeof month.DocumentTitle === 'string' &&
    typeof month.InitialReleaseDate === 'string'
  );
}

function formatDate(date: string | undefined): string {
  if (!date) return '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString();
}

async function fetchMonths(signal: AbortSignal): Promise<UpdateMonth[]> {
  const response = await fetch('/api/msrc', { signal });
  if (!response.ok) throw new Error('Failed to fetch security update months');
  const data = (await response.json()) as { value?: unknown };
  const months = Array.isArray(data.value) ? data.value.filter(isUpdateMonth) : [];
  return months.toSorted(
    (a: UpdateMonth, b: UpdateMonth) =>
      new Date(b.InitialReleaseDate).getTime() - new Date(a.InitialReleaseDate).getTime()
  );
}

async function fetchCVEsForMonth(
  monthId: string,
  page: number,
  signal: AbortSignal
): Promise<CvrfResponse> {
  const response = await fetch(`/api/msrc?monthId=${encodeURIComponent(monthId)}&page=${page}`, {
    signal,
  });
  if (!response.ok) throw new Error('Failed to fetch security updates for the selected month');
  return (await response.json()) as CvrfResponse;
}

function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <span className="sr-only">Loading Microsoft security updates…</span>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          aria-hidden="true"
          className="animate-pulse rounded-xl border border-line bg-surface p-4"
        >
          <div className="h-5 w-2/3 rounded bg-surface-sunken" />
          <div className="mt-3 h-3 w-32 rounded bg-surface-sunken" />
          <div className="mt-4 h-24 rounded bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}

function SecurityUpdatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMonth = useRef(searchParams.get('month'));
  const [months, setMonths] = useState<UpdateMonth[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>();
  const [page, setPage] = useState(() => {
    const requestedPage = Number(searchParams.get('page'));
    return Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalVulnerabilities, setTotalVulnerabilities] = useState(0);
  const [releaseDate, setReleaseDate] = useState('');
  const [productTree, setProductTree] = useState<ProductTree>();
  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  function updateQuery(month: string, nextPage: number) {
    const query =
      nextPage > 1
        ? `?month=${encodeURIComponent(month)}&page=${nextPage}`
        : `?month=${encodeURIComponent(month)}`;
    router.replace(`/msrc${query}`, { scroll: false });
  }

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    fetchMonths(controller.signal)
      .then(monthData => {
        setMonths(monthData);
        const requestedMonth = initialMonth.current;
        const nextMonth =
          requestedMonth && monthData.some(month => month.ID === requestedMonth)
            ? requestedMonth
            : monthData[0]?.ID;
        setSelectedMonth(nextMonth);
        if (nextMonth && requestedMonth !== nextMonth) {
          setPage(1);
          router.replace(`/msrc?month=${encodeURIComponent(nextMonth)}`, { scroll: false });
        }
      })
      .catch(fetchError => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError(
          fetchError instanceof Error ? fetchError.message : 'Failed to load security updates.'
        );
      })
      .finally(() => setIsLoadingMonths(false));

    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!selectedMonth) return;

    const controller = new AbortController();
    setIsLoadingUpdates(true);
    setError(null);

    fetchCVEsForMonth(selectedMonth, page, controller.signal)
      .then(data => {
        setVulnerabilities(Array.isArray(data.Vulnerability) ? data.Vulnerability : []);
        setReleaseDate(data.ReleaseDate || '');
        setProductTree(data.ProductTree);
        setTotalPages(data.totalPages && data.totalPages > 0 ? data.totalPages : 1);
        setTotalVulnerabilities(data.totalVulnerabilities ?? 0);
        // The API clamps out-of-range pages, so mirror the page it actually served.
        if (data.page && data.page !== page) setPage(data.page);
      })
      .catch(fetchError => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError(
          fetchError instanceof Error ? fetchError.message : 'Failed to load security updates.'
        );
      })
      .finally(() => setIsLoadingUpdates(false));

    return () => controller.abort();
  }, [selectedMonth, page]);

  function handleMonthChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const month = event.target.value;
    setSelectedMonth(month);
    setPage(1);
    updateQuery(month, 1);
  }

  function handlePageChange(nextPage: number) {
    if (!selectedMonth || nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    updateQuery(selectedMonth, nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const hasResults = vulnerabilities.length > 0;
  const isLoading = isLoadingMonths || isLoadingUpdates;

  return (
    <section
      className="mx-auto max-w-5xl px-4 py-8 sm:px-6"
      aria-labelledby="security-updates-heading"
    >
      <header className="mb-6">
        <p className="type-eyebrow text-accent">Security</p>
        <h1 id="security-updates-heading" className="type-h1 mt-1 text-ink">
          Microsoft Security Response Center Security Updates
          {selectedMonth ? ` (${selectedMonth})` : ''}
        </h1>
        <p className="type-body-sm mt-2 text-ink-muted">
          Source:{' '}
          <a
            href="https://msrc.microsoft.com/update-guide/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Microsoft Security Update Guide
          </a>
        </p>
      </header>

      <div className="sticky top-[var(--app-header-h,6.5rem)] z-30 -mx-4 mb-6 border-y border-line bg-surface/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label htmlFor="month" className="type-body-sm font-medium text-ink">
            Update month
          </label>
          <select
            id="month"
            name="month"
            value={selectedMonth ?? ''}
            onChange={handleMonthChange}
            disabled={isLoadingMonths || months.length === 0}
            className="type-body-sm min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-ink shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-xs sm:flex-none"
          >
            {months.map(month => (
              <option key={month.ID} value={month.ID}>
                {month.DocumentTitle}
              </option>
            ))}
          </select>

          <p className="type-meta ml-auto text-ink-subtle" aria-live="polite">
            {totalVulnerabilities > 0
              ? `${totalVulnerabilities.toLocaleString()} vulnerabilities · page ${page} of ${totalPages}`
              : null}
            {totalVulnerabilities > 0 && releaseDate ? ' · ' : null}
            {releaseDate ? `Released ${formatDate(releaseDate)}` : null}
          </p>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-critical/30 bg-critical-soft px-4 py-10 text-center text-critical-ink"
          role="alert"
        >
          <p className="type-body">
            {error}. Try again later or use the Microsoft Security Update Guide link above.
          </p>
        </div>
      ) : isLoading ? (
        <LoadingState />
      ) : !hasResults ? (
        <p className="type-body py-12 text-center text-ink-muted" role="status">
          No published vulnerabilities were returned for this month.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {vulnerabilities.map(vulnerability => (
              <CVECard key={vulnerability.ID} vuln={vulnerability} productTree={productTree} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav
              className="mt-8 flex items-center justify-center gap-4"
              aria-label="Security update pages"
            >
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="type-body-sm rounded-lg border border-line px-4 py-2 font-medium text-ink transition-colors hover:bg-surface-sunken hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="type-body-sm text-ink-muted" aria-live="polite">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="type-body-sm rounded-lg border border-line px-4 py-2 font-medium text-ink transition-colors hover:bg-surface-sunken hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}

export default function SecurityUpdatesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SecurityUpdatesContent />
    </Suspense>
  );
}
