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
  Description?: unknown;
  CVE?: string[];
  ProductStatuses?: unknown[];
  Threats?: unknown[];
  Remediations?: unknown[];
  CVSSScoreSets?: unknown[];
  References?: unknown[];
  Acknowledgments?: unknown[];
  ReleaseDate?: string;
  RevisionHistory?: unknown[];
  [key: string]: unknown;
}

interface ProductTree {
  FullProductName?: { ProductID: string; Value: string }[];
}

interface CvrfResponse {
  Vulnerability?: Vulnerability[];
  ReleaseDate?: string;
  RevisionHistory?: unknown[];
  ProductTree?: ProductTree;
}

function getFieldValue(field: unknown): string {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object' && 'Value' in field) {
    const value = (field as { Value: unknown }).Value;
    return typeof value === 'string' ? value : '';
  }
  return '';
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

async function fetchCVEsForMonth(monthId: string, signal: AbortSignal): Promise<CvrfResponse> {
  const response = await fetch(`/api/msrc?monthId=${encodeURIComponent(monthId)}`, { signal });
  if (!response.ok) throw new Error('Failed to fetch security updates for the selected month');
  return (await response.json()) as CvrfResponse;
}

function LoadingState() {
  return (
    <div
      className="py-16 text-center text-gray-500 dark:text-gray-400"
      role="status"
      aria-live="polite"
    >
      Loading Microsoft security updates…
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
  const [releaseDate, setReleaseDate] = useState('');
  const [revisionHistory, setRevisionHistory] = useState<unknown[]>();
  const [productTree, setProductTree] = useState<ProductTree>();
  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

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

    fetchCVEsForMonth(selectedMonth, controller.signal)
      .then(data => {
        setVulnerabilities(Array.isArray(data.Vulnerability) ? data.Vulnerability : []);
        setReleaseDate(data.ReleaseDate || '');
        setRevisionHistory(data.RevisionHistory);
        setProductTree(data.ProductTree);
      })
      .catch(fetchError => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError(
          fetchError instanceof Error ? fetchError.message : 'Failed to load security updates.'
        );
      })
      .finally(() => setIsLoadingUpdates(false));

    return () => controller.abort();
  }, [selectedMonth]);

  function handleMonthChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const month = event.target.value;
    setSelectedMonth(month);
    router.replace(`/msrc?month=${encodeURIComponent(month)}`, { scroll: false });
  }

  const visibleVulnerabilities = vulnerabilities.filter(
    vulnerability => getFieldValue(vulnerability.Title).trim() !== ''
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-8" aria-labelledby="security-updates-heading">
      <h1
        id="security-updates-heading"
        className="mb-3 text-center text-2xl font-bold text-gray-900 dark:text-white"
      >
        Microsoft Security Response Center Security Updates
        {selectedMonth ? ` (${selectedMonth})` : ''}
      </h1>
      <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Source:{' '}
        <a
          href="https://msrc.microsoft.com/update-guide/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-700 underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400"
        >
          Microsoft Security Update Guide
        </a>
      </p>

      <label
        htmlFor="month"
        className="mb-2 block text-center text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Update month
      </label>
      <select
        id="month"
        name="month"
        value={selectedMonth ?? ''}
        onChange={handleMonthChange}
        disabled={isLoadingMonths || months.length === 0}
        className="mx-auto mb-6 block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      >
        {months.map(month => (
          <option key={month.ID} value={month.ID}>
            {month.DocumentTitle}
          </option>
        ))}
      </select>

      {releaseDate ? (
        <p className="mb-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Release date: {formatDate(releaseDate)}
        </p>
      ) : null}

      {error ? (
        <div className="py-12 text-center text-lg text-red-600 dark:text-red-400" role="alert">
          {error}. Try again later or use the Microsoft Security Update Guide link above.
        </div>
      ) : isLoadingMonths || isLoadingUpdates ? (
        <LoadingState />
      ) : visibleVulnerabilities.length === 0 ? (
        <p className="py-12 text-center text-gray-600 dark:text-gray-400" role="status">
          No published vulnerabilities were returned for this month.
        </p>
      ) : (
        <div className="space-y-8">
          {visibleVulnerabilities.map(vulnerability => (
            <CVECard
              key={`${vulnerability.ID}-${vulnerability.CVE?.[0] ?? ''}`}
              vuln={vulnerability}
              month={selectedMonth ?? ''}
              releaseDate={releaseDate}
              revisionHistory={revisionHistory}
              productTree={productTree}
            />
          ))}
        </div>
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
