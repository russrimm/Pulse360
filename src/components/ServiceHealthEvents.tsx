import { Suspense } from 'react';
import Link from 'next/link';
import { HealthEventCard } from '@/components/HealthEventCard';
import { ListFilterBar } from '@/components/ListFilterBar';
import { Pagination } from '@/components/Pagination';
import { hasActiveFilters, type ListParams, type ListQueryResult } from '@/lib/list-query';
import type { HealthEvent, HealthSectionState } from '@/lib/health/types';

interface ServiceHealthEventsProps {
  basePath: string;
  params: ListParams;
  result: ListQueryResult<HealthEvent>;
  eventsState: HealthSectionState;
  windowDays: number;
}

/**
 * Issue list with URL-driven filters. "No issues" is only claimed when the
 * issue history loaded; otherwise the section says it could not be loaded.
 */
export function ServiceHealthEvents({
  basePath,
  params,
  result,
  eventsState,
  windowDays,
}: ServiceHealthEventsProps) {
  const isFiltered = hasActiveFilters(params);

  return (
    <section
      id="issues"
      aria-labelledby="service-issues-heading"
      data-service-health-section="issues"
      className="scroll-mt-40"
    >
      <h2 id="service-issues-heading" className="type-h3 mb-3 text-ink">
        Incidents and advisories
      </h2>

      {eventsState === 'unavailable' ? (
        <div
          role="alert"
          data-service-health-section-state="events-unavailable"
          className="type-body-sm rounded-xl border border-warn/30 bg-warn-soft px-4 py-6 text-center text-warn-ink"
        >
          <p className="type-h3">Issue history is temporarily unavailable</p>
          <p className="mt-2">
            We could not load incidents and advisories, so none are shown. This is not a report that
            there are none.
          </p>
          <Link
            href={basePath}
            prefetch={false}
            className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Try again
          </Link>
        </div>
      ) : result.totalCount === 0 ? (
        <p
          role="status"
          data-service-health-section-state="events-empty"
          className="type-body-sm rounded-xl border border-line bg-surface px-4 py-6 text-center text-ink-muted"
        >
          No incidents or advisories started in the last {windowDays} days.
        </p>
      ) : (
        <>
          <Suspense fallback={null}>
            <ListFilterBar
              query={params.q}
              date={params.date}
              from={params.from}
              to={params.to}
              facets={result.facets}
              filteredCount={result.filteredCount}
              totalCount={result.totalCount}
              noun="issue"
              searchPlaceholder="Search issues, services, or IDs…"
            />
          </Suspense>
          {result.filteredCount === 0 ? (
            <div className="py-16 text-center" role="status">
              <p className="type-h3 text-ink">No issues match these filters</p>
              {isFiltered ? (
                <Link
                  href={basePath}
                  className="type-body-sm mt-3 inline-block font-medium text-accent-ink underline-offset-2 hover:underline"
                >
                  Clear all filters
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map(event => (
                <HealthEventCard key={event.id} event={event} />
              ))}
            </ul>
          )}
          <Pagination
            basePath={basePath}
            params={params}
            page={result.page}
            pageCount={result.pageCount}
          />
        </>
      )}
    </section>
  );
}
