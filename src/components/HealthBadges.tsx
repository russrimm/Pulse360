import { StatusChip, type ChipTone } from '@/components/StatusChip';
import { LEVEL_LABELS, SEVERITY_LABELS } from '@/lib/health/status';
import type { HealthLevel, HealthSeverity } from '@/lib/health/types';

export const LEVEL_TONES: Record<HealthLevel, ChipTone> = {
  operational: 'ok',
  degraded: 'warn',
  interruption: 'critical',
  investigating: 'info',
  restoring: 'warn',
  extended: 'critical',
  unknown: 'neutral',
};

export const SEVERITY_TONES: Record<HealthSeverity, ChipTone> = {
  critical: 'critical',
  warning: 'warn',
  informational: 'info',
};

export function SeverityChip({ severity }: { severity: HealthSeverity }) {
  return <StatusChip tone={SEVERITY_TONES[severity]}>{SEVERITY_LABELS[severity]}</StatusChip>;
}

export function LevelChip({ level, label }: { level: HealthLevel; label?: string }) {
  return <StatusChip tone={LEVEL_TONES[level]}>{label ?? LEVEL_LABELS[level]}</StatusChip>;
}
