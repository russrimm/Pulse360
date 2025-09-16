"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface ReleasePlanIndexItem {
  id: string;
  title: string;
  product: string;
  tags: string[];
  investmentArea: string;
  publicPreviewDate: string;
  gaDate: string;
}

function formatDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Props { future: ReleasePlanIndexItem[]; past: ReleasePlanIndexItem[]; }

export const FuturePastReleasePlanList: React.FC<Props> = ({ future, past }) => {
  const [openFuture, setOpenFuture] = useState(false);
  const [openPast, setOpenPast] = useState(false);

  // Tertiary grouping for future items
  const { thisMonth, next90, later } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const inThisMonth: ReleasePlanIndexItem[] = [];
    const inNext90: ReleasePlanIndexItem[] = [];
    const inLater: ReleasePlanIndexItem[] = [];
    const boundary90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).getTime();
    future.forEach(p => {
      if (!p.gaDate) { inLater.push(p); return; }
      const d = new Date(p.gaDate);
      if (isNaN(d.getTime())) { inLater.push(p); return; }
      const time = d.getTime();
      if (d.getFullYear() === year && d.getMonth() === month) inThisMonth.push(p);
      else if (time <= boundary90) inNext90.push(p); else inLater.push(p);
    });
    return { thisMonth: inThisMonth, next90: inNext90, later: inLater };
  }, [future]);

  const renderPlan = (plan: ReleasePlanIndexItem) => (
    <li key={plan.id} className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:gap-4">
      <div className="flex-1 min-w-0">
        <Link href={`/release-plan/${plan.id}`} prefetch={false} className="group/feat inline-flex items-start font-medium text-sm sm:text-[15px] text-primary-700 dark:text-primary-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded">
          <span className="line-clamp-2 group-hover/feat:text-primary-600 dark:group-hover/feat:text-primary-200">{plan.title}</span>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
          {plan.investmentArea && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-100 dark:border-primary-800">{plan.investmentArea}</span>
          )}
          {plan.publicPreviewDate && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800">PP: {formatDate(plan.publicPreviewDate)}</span>
          )}
          {plan.gaDate && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-100 dark:border-green-800">GA: {formatDate(plan.gaDate)}</span>
          )}
          {!plan.gaDate && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300 border border-gray-200 dark:border-gray-700">GA: TBD</span>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
      {future.length > 0 && (
        <li className="-mx-5">
          <div className="py-2 px-5 bg-gray-50/60 dark:bg-gray-800/40 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpenFuture(o => !o)}
              className="flex items-center gap-2 text-left focus:outline-none group"
              id="future-plans-trigger"
              data-expanded={openFuture ? 'true' : 'false'}
            >
              <svg className={`w-4 h-4 text-primary-600 dark:text-primary-300 transition-transform ${openFuture ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M6.293 2.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L11.586 10 6.293 4.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd"/></svg>
              <h4 className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-primary-600 dark:text-primary-300">Future<span className="ml-2 font-normal text-gray-500 dark:text-gray-400">({future.length})</span></h4>
            </button>
            <span className="h-px flex-1 bg-gradient-to-r from-primary-400/40 to-transparent dark:from-primary-600/40" />
          </div>
          <div
            id="future-plans"
            role="region"
            aria-labelledby="future-plans-trigger"
            className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out px-5 ${openFuture ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'} `}
          >
            {/* Tertiary grouping headings */}
            {thisMonth.length > 0 && (
              <div className="pt-3 pb-1">
                <h5 className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-primary-500 dark:text-primary-300">This Month <span className="font-normal text-gray-500 dark:text-gray-400">({thisMonth.length})</span></h5>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 mt-1">{thisMonth.map(renderPlan)}</ul>
              </div>
            )}
            {next90.length > 0 && (
              <div className="pt-4 pb-1">
                <h5 className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-300">Next 90 Days <span className="font-normal text-gray-500 dark:text-gray-400">({next90.length})</span></h5>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 mt-1">{next90.map(renderPlan)}</ul>
              </div>
            )}
            {later.length > 0 && (
              <div className="pt-4 pb-2">
                <h5 className="text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-gray-600 dark:text-gray-300">Later <span className="font-normal text-gray-500 dark:text-gray-400">({later.length})</span></h5>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 mt-1">{later.map(renderPlan)}</ul>
              </div>
            )}
          </div>
        </li>
      )}
      {past.length > 0 && (
        <li className="-mx-5">
          <div className="py-2 px-5 bg-gray-50/60 dark:bg-gray-800/40 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setOpenPast(o => !o)}
              className="flex items-center gap-2 text-left focus:outline-none group"
              id="past-plans-trigger"
              data-expanded={openPast ? 'true' : 'false'}
            >
              <svg className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${openPast ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M6.293 2.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L11.586 10 6.293 4.707a1 1 0 0 1 0-1.414Z" clipRule="evenodd"/></svg>
              <h4 className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-gray-600 dark:text-gray-300">Past<span className="ml-2 font-normal text-gray-500 dark:text-gray-400">({past.length})</span></h4>
            </button>
            <span className="h-px flex-1 bg-gradient-to-r from-gray-300/50 to-transparent dark:from-gray-600/50" />
          </div>
          <div
            id="past-plans"
            role="region"
            aria-labelledby="past-plans-trigger"
            className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out px-5 ${openPast ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'} `}
          >
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 pt-3 pb-2">{past.map(renderPlan)}</ul>
          </div>
        </li>
      )}
    </ul>
  );
};
