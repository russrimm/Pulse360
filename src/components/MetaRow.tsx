import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface MetaRowProps {
  /** Nullish entries are dropped so callers can inline conditionals. */
  items: ReactNode[];
  className?: string;
}

/**
 * Dot-separated metadata line (dates, counts, sources) with a consistent
 * tabular-figure treatment so columns of cards line up.
 */
export function MetaRow({ items, className }: MetaRowProps) {
  const visible = items.filter(item => item !== null && item !== undefined && item !== false);
  if (visible.length === 0) return null;

  return (
    <p className={cn('type-meta flex flex-wrap items-center gap-x-1.5 text-ink-subtle', className)}>
      {visible.map((item, index) => (
        <span key={index} className="inline-flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="text-line-strong">
              &middot;
            </span>
          ) : null}
          {item}
        </span>
      ))}
    </p>
  );
}
