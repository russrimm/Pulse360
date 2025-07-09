import React from 'react';
import Link from 'next/link';
import CVECard from '../../components/CVECard';

const API_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/updates';
const CVRF_URL = 'https://api.msrc.microsoft.com/cvrf/v3.0/cvrf/';

interface UpdateMonth {
  ID: string;
  DocumentTitle: string;
  InitialReleaseDate: string;
}

interface Vulnerability {
  ID: string;
  Title?: any;
  Description?: any;
  CVE?: string[];
  ProductStatuses?: any[];
  Threats?: any[];
  Remediations?: any[];
  CVSSScoreSets?: any[];
  References?: any[];
  Acknowledgments?: any[];
  ReleaseDate?: string;
  RevisionHistory?: any[];
  [key: string]: any;
}

function getFieldValue(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && 'Value' in field) return field.Value;
  return '';
}

function formatDate(date: string | undefined) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

async function fetchMonths(): Promise<UpdateMonth[]> {
  const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch months');
  const data = await res.json();
  return (data.value || []).sort((a: UpdateMonth, b: UpdateMonth) => new Date(b.InitialReleaseDate).getTime() - new Date(a.InitialReleaseDate).getTime());
}

async function fetchCVEsForMonth(monthId: string): Promise<Vulnerability[]> {
  const res = await fetch(CVRF_URL + monthId, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Failed to fetch CVEs for month');
  const data = await res.json();
  return data.Vulnerability || [];
}

export default async function SecurityUpdatesPage({ searchParams }: { searchParams?: { month?: string } }) {
  const params = searchParams;
  let months: UpdateMonth[] = [];
  let vulnerabilities: Vulnerability[] = [];
  let error: string | null = null;
  let selectedMonth = params?.month;
  let releaseDate = '';
  let revisionHistory: any[] | undefined = undefined;
  let productTree: any = undefined;
  try {
    months = await fetchMonths();
    if (!selectedMonth) {
      selectedMonth = months[0]?.ID;
    }
    if (selectedMonth) {
      const res = await fetch(CVRF_URL + selectedMonth, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch CVEs for month');
      const data = await res.json();
      vulnerabilities = data.Vulnerability || [];
      releaseDate = data.ReleaseDate || '';
      revisionHistory = data.RevisionHistory;
      productTree = data.ProductTree;
    }
  } catch (e: any) {
    error = e?.message || 'Failed to load security updates.';
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">MSRC Security Updates ({selectedMonth})</h1>
      <form className="flex justify-center mb-8" action="/security-updates" method="get">
        <label htmlFor="month" className="sr-only">Select Month</label>
        <select
          id="month"
          name="month"
          defaultValue={selectedMonth}
          className="w-full max-w-xs px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        >
          {months.map((m) => (
            <option key={m.ID} value={m.ID}>{m.DocumentTitle}</option>
          ))}
        </select>
        <button type="submit" className="ml-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition">Go</button>
      </form>
      {releaseDate && (
        <div className="mb-6 text-center text-xs text-gray-500 dark:text-gray-400">Release Date: {formatDate(releaseDate)}</div>
      )}
      {error ? (
        <div className="text-center text-red-600 dark:text-red-400 py-12 text-lg">
          {error}<br />
          Please try again later or visit the <a href="https://msrc.microsoft.com/update-guide/" target="_blank" rel="noopener noreferrer" className="underline text-primary-700 dark:text-primary-400">MSRC Update Guide</a> directly.
        </div>
      ) : (
        <div className="space-y-8">
          {vulnerabilities.map((vuln, idx) => (
            <CVECard key={`${vuln.ID || (vuln.CVE && vuln.CVE[0]) || ''}-${idx}`} vuln={vuln} month={selectedMonth!} releaseDate={releaseDate} revisionHistory={revisionHistory} productTree={productTree} />
          ))}
          {vulnerabilities.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12 text-lg">No CVEs found for this month.</div>
          )}
        </div>
      )}
    </main>
  );
} 