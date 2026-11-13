'use client';

import { useQuery } from '@tanstack/react-query';
import { ProductNewsCard } from '@/components/ProductNewsCard';
import type { ProductNews } from '@/lib/types';

interface FeedStateGridProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry: () => void;
  items?: ProductNews[];
  productIcon?: string;
}

const GRID_CLASS = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3';

function FeedSkeleton() {
  return (
    <div className={GRID_CLASS} role="status" aria-live="polite">
      <span className="sr-only">Loading posts…</span>
      {[0, 1, 2].map(index => (
        <div
          key={index}
          aria-hidden="true"
          className="flex min-w-0 animate-pulse flex-col gap-3 rounded-xl border border-line bg-surface p-4"
        >
          <div className="h-5 w-3/4 rounded bg-surface-sunken" />
          <div className="h-3 w-1/2 rounded bg-surface-sunken" />
          <div className="h-3 w-5/6 rounded bg-surface-sunken" />
          <div className="h-3 w-2/3 rounded bg-surface-sunken" />
          <div className="mt-auto h-8 w-24 rounded bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}

/**
 * Shared loading / error / empty / results states for every Product News
 * feed so the feed pages stay visually and behaviorally identical.
 */
export function FeedStateGrid({
  isLoading,
  isError,
  error,
  onRetry,
  items,
  productIcon,
}: FeedStateGridProps) {
  if (isLoading) return <FeedSkeleton />;

  if (isError) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-xl border border-critical/30 bg-critical-soft px-6 py-8 text-center text-critical-ink"
      >
        <p className="type-body">
          {error instanceof Error ? error.message : 'Failed to load news. Please try again later.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="type-body-sm mt-4 inline-flex min-h-9 items-center rounded-lg border border-line-strong bg-surface px-4 font-medium text-ink hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="type-body py-12 text-center text-ink-muted" role="status">
        No posts are available right now. Check back soon.
      </p>
    );
  }

  return (
    <div className={GRID_CLASS}>
      {items.map(item => (
        <ProductNewsCard key={item.id} news={item} productIcon={productIcon} />
      ))}
    </div>
  );
}

interface FeedQueryGridProps {
  queryKey: string;
  queryFn: () => Promise<ProductNews[]>;
  productIcon?: string;
}

export function FeedQueryGrid({ queryKey, queryFn, productIcon }: FeedQueryGridProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [queryKey],
    queryFn,
  });

  return (
    <FeedStateGrid
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => void refetch()}
      items={data}
      productIcon={productIcon}
    />
  );
}
