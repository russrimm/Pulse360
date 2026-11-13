import Link from 'next/link';
import { buildListQuery, type ListParams } from '@/lib/list-query';

interface PaginationProps {
  basePath: string;
  params: ListParams;
  page: number;
  pageCount: number;
}

const linkClass =
  'type-body-sm inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-line bg-surface px-3 font-medium text-ink hover:border-line-strong hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const disabledClass =
  'type-body-sm inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-line px-3 text-ink-subtle opacity-60';

function visiblePages(page: number, pageCount: number): Array<number | 'gap'> {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter(value => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  const result: Array<number | 'gap'> = [];
  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) result.push('gap');
    result.push(value);
  });
  return result;
}

/** Server-rendered pagination: plain links, so it works without JavaScript. */
export function Pagination({ basePath, params, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;
  const hrefFor = (target: number) => `${basePath}${buildListQuery(params, { page: target })}`;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Previous
        </span>
      )}
      {visiblePages(page, pageCount).map((entry, index) =>
        entry === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-ink-subtle" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            aria-current={entry === page ? 'page' : undefined}
            aria-label={`Page ${entry}`}
            className={
              entry === page
                ? `${linkClass} border-accent/40 bg-accent-soft text-accent-ink`
                : linkClass
            }
          >
            {entry}
          </Link>
        )
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
          Next
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}
