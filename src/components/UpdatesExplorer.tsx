import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { ListFilterBar } from '@/components/ListFilterBar';
import { Pagination } from '@/components/Pagination';
import { hasActiveFilters, type ListParams, type ListQueryResult } from '@/lib/list-query';

interface UpdatesExplorerProps<T> {
  title: string;
  description: string;
  basePath: string;
  params: ListParams;
  result: ListQueryResult<T>;
  noun?: string;
  searchPlaceholder?: string;
  renderItem: (item: T) => ReactNode;
}

/**
 * Shared layout for server-filtered, server-paginated update lists. Pages own
 * data loading and card rendering; this owns the header, filter bar, results
 * grid, empty/error states, and pagination so the lists stay consistent.
 */
export function UpdatesExplorer<T>({
  title,
  description,
  basePath,
  params,
  result,
  noun = 'update',
  searchPlaceholder,
  renderItem,
}: UpdatesExplorerProps<T>) {
  const isFiltered = hasActiveFilters(params);

  return (
    <div className="bg-canvas pt-12 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <h1 className="type-h1 text-ink">{title}</h1>
          <p className="type-body mt-2 text-ink-muted">{description}</p>
        </header>

        {result.totalCount === 0 ? (
          <div
            role="alert"
            className="type-body-sm mx-auto max-w-xl rounded-xl border border-warn/30 bg-warn-soft px-6 py-8 text-center text-warn-ink"
          >
            <p className="type-h3">{title} are temporarily unavailable</p>
            <p className="mt-2">
              The upstream Microsoft feed returned no data. Try again in a few minutes.
            </p>
            <Link
              href={basePath}
              prefetch={false}
              className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Try again
            </Link>
          </div>
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
                noun={noun}
                searchPlaceholder={searchPlaceholder}
              />
            </Suspense>
            {result.filteredCount === 0 ? (
              <div className="py-16 text-center" role="status">
                <p className="type-h3 text-ink">No {noun}s match these filters</p>
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
              <ul className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {result.items.map(item => renderItem(item))}
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
      </div>
    </div>
  );
}
