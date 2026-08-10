import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type SurfaceTone = 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'critical';
type SurfaceElement = 'div' | 'article' | 'section' | 'li';

interface SurfaceCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Renders a status rail down the leading edge instead of a banner row. */
  accent?: SurfaceTone;
  as?: SurfaceElement;
  className?: string;
  /** Adds hover lift + border emphasis. Use when the card is inside a link. */
  interactive?: boolean;
  /** Drops the default padding so callers can lay out their own regions. */
  flush?: boolean;
  muted?: boolean;
}

const accentClasses: Record<SurfaceTone, string> = {
  neutral: 'bg-line-strong',
  accent: 'bg-accent',
  info: 'bg-info',
  ok: 'bg-ok',
  warn: 'bg-warn',
  critical: 'bg-critical',
};

/**
 * The single card surface for the app. Replaces the hand-rolled
 * `bg-white/80 dark:bg-gray-800/50 rounded-xl shadow-sm …` string that was
 * duplicated across the feed, roadmap, message, and CVE cards.
 */
export function SurfaceCard({
  children,
  accent,
  as: Component = 'div',
  className,
  interactive = false,
  flush = false,
  muted = false,
  ...rest
}: SurfaceCardProps) {
  return (
    <Component
      {...rest}
      className={cn(
        'relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none',
        muted && 'opacity-70',
        !flush && 'p-4',
        accent && !flush && 'pl-5',
        accent && flush && 'pl-2',
        className
      )}
    >
      {accent ? (
        <span
          aria-hidden="true"
          className={cn('absolute inset-y-0 left-0 w-1', accentClasses[accent])}
        />
      ) : null}
      {children}
    </Component>
  );
}
