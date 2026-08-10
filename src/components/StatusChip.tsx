import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ChipTone = 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'critical';
export type ChipSize = 'sm' | 'md';

interface StatusChipProps {
  children: ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  icon?: ReactNode;
  title?: string;
  className?: string;
}

const toneClasses: Record<ChipTone, string> = {
  neutral: 'bg-muted-soft text-muted-ink border-line',
  accent: 'bg-accent-soft text-accent-ink border-accent/25',
  info: 'bg-info-soft text-info-ink border-info/25',
  ok: 'bg-ok-soft text-ok-ink border-ok/25',
  warn: 'bg-warn-soft text-warn-ink border-warn/25',
  critical: 'bg-critical-soft text-critical-ink border-critical/30',
};

const sizeClasses: Record<ChipSize, string> = {
  sm: 'h-5 gap-1 px-2 text-[11px]',
  md: 'h-6 gap-1.5 px-2.5 text-xs',
};

export function StatusChip({
  children,
  tone = 'neutral',
  size = 'sm',
  icon,
  title,
  className,
}: StatusChipProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded-full border font-medium whitespace-nowrap',
        toneClasses[tone],
        sizeClasses[size],
        className
      )}
    >
      {icon ? (
        <span className="flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
